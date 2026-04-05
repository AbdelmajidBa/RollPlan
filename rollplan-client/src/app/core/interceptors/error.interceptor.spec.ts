import { TestBed } from '@angular/core/testing';
import {
  HttpClient,
  provideHttpClient,
  withInterceptors
} from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { signal, computed } from '@angular/core';
import { vi } from 'vitest';
import { errorInterceptor } from './error.interceptor';
import { AuthService } from '../../auth/services/auth.service';

describe('errorInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let tokenSignal: ReturnType<typeof signal<string | null>>;
  let navigateSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    tokenSignal = signal<string | null>(null);
    navigateSpy = vi.fn();

    const authServiceStub = {
      getToken: () => tokenSignal(),
      logout: () => { tokenSignal.set(null); },
      isAuthenticated: computed(() => tokenSignal() !== null)
    };
    const routerStub = { navigate: navigateSpy };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceStub },
        { provide: Router, useValue: routerStub },
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting()
      ]
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should redirect to /login and logout on 401 when token is present', () => {
    tokenSignal.set('valid-token');

    http.get('/api/v1/trips').subscribe({ error: () => {} });

    const req = httpMock.expectOne('/api/v1/trips');
    req.flush({ detail: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    expect(tokenSignal()).toBeNull();
    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
  });

  it('should not redirect on 401 when no token present (login failure)', () => {
    tokenSignal.set(null);

    http.post('/api/v1/auth/login', {}).subscribe({ error: () => {} });

    const req = httpMock.expectOne('/api/v1/auth/login');
    req.flush({ detail: 'Invalid email or password.' }, { status: 401, statusText: 'Unauthorized' });

    expect(navigateSpy).not.toHaveBeenCalled();
  });
});
