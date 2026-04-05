import { TestBed } from '@angular/core/testing';
import {
  HttpClient,
  provideHttpClient,
  withInterceptors
} from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal, computed } from '@angular/core';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../../auth/services/auth.service';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let tokenSignal: ReturnType<typeof signal<string | null>>;

  beforeEach(() => {
    tokenSignal = signal<string | null>(null);
    const authServiceStub = {
      getToken: () => tokenSignal(),
      isAuthenticated: computed(() => tokenSignal() !== null)
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceStub },
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting()
      ]
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should attach Authorization header when token is present', () => {
    tokenSignal.set('test-jwt-token');

    http.get('/api/v1/trips').subscribe();

    const req = httpMock.expectOne('/api/v1/trips');
    expect(req.request.headers.get('Authorization')).toBe('Bearer test-jwt-token');
    req.flush([]);
  });

  it('should not attach Authorization header when no token', () => {
    tokenSignal.set(null);

    http.get('/api/v1/trips').subscribe();

    const req = httpMock.expectOne('/api/v1/trips');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush([]);
  });
});
