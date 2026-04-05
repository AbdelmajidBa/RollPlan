import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { API_BASE_URL } from '../../core/config/api.config';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('register()', () => {
    it('should store token in localStorage and update isAuthenticated signal on success', () => {
      expect(service.isAuthenticated()).toBe(false);

      service.register('test@example.com', 'password123').subscribe();

      const req = httpMock.expectOne(`${API_BASE_URL}/auth/register`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ email: 'test@example.com', password: 'password123' });

      req.flush({ token: 'test-jwt-token', email: 'test@example.com', displayName: '' });

      expect(localStorage.getItem('token')).toBe('test-jwt-token');
      expect(service.isAuthenticated()).toBe(true);
      expect(service.getToken()).toBe('test-jwt-token');
    });

    it('should not store token on 400 error response', () => {
      service.register('dup@example.com', 'password123').subscribe({
        error: () => { /* expected */ }
      });

      const req = httpMock.expectOne(`${API_BASE_URL}/auth/register`);
      req.flush(
        { detail: 'Email is already registered.' },
        { status: 400, statusText: 'Bad Request' }
      );

      expect(localStorage.getItem('token')).toBeNull();
      expect(service.isAuthenticated()).toBe(false);
    });
  });

  describe('login()', () => {
    it('should store token in localStorage and update isAuthenticated signal on success', () => {
      expect(service.isAuthenticated()).toBe(false);

      service.login('test@example.com', 'password123').subscribe();

      const req = httpMock.expectOne(`${API_BASE_URL}/auth/login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ email: 'test@example.com', password: 'password123' });

      req.flush({ token: 'login-jwt-token', email: 'test@example.com', displayName: '' });

      expect(localStorage.getItem('token')).toBe('login-jwt-token');
      expect(service.isAuthenticated()).toBe(true);
      expect(service.getToken()).toBe('login-jwt-token');
    });

    it('should propagate error on 401 without storing token', () => {
      service.login('test@example.com', 'wrongpassword').subscribe({
        error: () => { /* expected */ }
      });

      const req = httpMock.expectOne(`${API_BASE_URL}/auth/login`);
      req.flush(
        { detail: 'Invalid email or password.' },
        { status: 401, statusText: 'Unauthorized' }
      );

      expect(localStorage.getItem('token')).toBeNull();
      expect(service.isAuthenticated()).toBe(false);
    });
  });

  describe('logout()', () => {
    it('should clear token from localStorage and set isAuthenticated to false', () => {
      localStorage.setItem('token', 'some-token');

      service.register('x@x.com', 'pass123').subscribe();
      const req = httpMock.expectOne(`${API_BASE_URL}/auth/register`);
      req.flush({ token: 'some-token', email: 'x@x.com', displayName: '' });

      service.logout();

      expect(localStorage.getItem('token')).toBeNull();
      expect(service.isAuthenticated()).toBe(false);
    });

    it('should clear currentUser signal on logout', () => {
      service.getProfile().subscribe();
      const req = httpMock.expectOne(`${API_BASE_URL}/users/me`);
      req.flush({ email: 'x@x.com', displayName: 'Alice' });

      expect(service.currentUser()).not.toBeNull();

      service.logout();

      expect(service.currentUser()).toBeNull();
    });
  });

  describe('getProfile()', () => {
    it('should fetch profile and update currentUser signal', () => {
      expect(service.currentUser()).toBeNull();

      service.getProfile().subscribe();

      const req = httpMock.expectOne(`${API_BASE_URL}/users/me`);
      expect(req.request.method).toBe('GET');
      req.flush({ email: 'user@example.com', displayName: 'Alice' });

      expect(service.currentUser()).toEqual({ email: 'user@example.com', displayName: 'Alice' });
    });
  });

  describe('updateProfile()', () => {
    it('should PATCH profile and update currentUser signal on success', () => {
      service.updateProfile('Bob', 'bob@example.com').subscribe();

      const req = httpMock.expectOne(`${API_BASE_URL}/users/me`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ displayName: 'Bob', email: 'bob@example.com' });
      req.flush({ email: 'bob@example.com', displayName: 'Bob' });

      expect(service.currentUser()).toEqual({ email: 'bob@example.com', displayName: 'Bob' });
    });

    it('should propagate error on 400 without updating currentUser', () => {
      service.updateProfile('Bob', 'taken@example.com').subscribe({
        error: () => { /* expected */ }
      });

      const req = httpMock.expectOne(`${API_BASE_URL}/users/me`);
      req.flush(
        { detail: 'Email is already in use.' },
        { status: 400, statusText: 'Bad Request' }
      );

      expect(service.currentUser()).toBeNull();
    });
  });
});
