import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../../auth/services/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && authService.getToken()) {
        // Only redirect to /login when we had a token — session expired or revoked.
        // Do NOT redirect when no token is present (e.g., failed login attempt).
        authService.logout();
        router.navigate(['/login']);
      }
      return throwError(() => err);
    })
  );
};
