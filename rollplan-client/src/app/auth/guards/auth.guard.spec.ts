import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { signal, computed } from '@angular/core';
import { vi } from 'vitest';
import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('authGuard', () => {
  let isAuthenticated: ReturnType<typeof signal<boolean>>;

  function runGuard() {
    return TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));
  }

  beforeEach(() => {
    isAuthenticated = signal(false);

    const authServiceStub = { isAuthenticated: computed(() => isAuthenticated()) };
    const routerStub = { createUrlTree: vi.fn().mockReturnValue('/login' as any) };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceStub },
        { provide: Router, useValue: routerStub }
      ]
    });
  });

  it('should allow access when authenticated', () => {
    isAuthenticated.set(true);
    const result = runGuard();
    expect(result).toBe(true);
  });

  it('should redirect to /login when not authenticated', () => {
    isAuthenticated.set(false);
    const router = TestBed.inject(Router);
    runGuard();
    expect(router.createUrlTree).toHaveBeenCalledWith(['/login']);
  });
});
