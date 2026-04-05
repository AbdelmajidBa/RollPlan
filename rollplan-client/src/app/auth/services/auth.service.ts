import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap } from 'rxjs';
import { API_BASE_URL } from '../../core/config/api.config';

interface AuthResponse {
  token: string;
  email: string;
  displayName: string;
}

export interface UserProfile {
  email: string;
  displayName: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _token = signal<string | null>(localStorage.getItem('token'));
  private readonly _currentUser = signal<UserProfile | null>(null);

  readonly isAuthenticated = computed(() => this._token() !== null);
  readonly currentUser = this._currentUser.asReadonly();

  constructor(private http: HttpClient) {}

  register(email: string, password: string): Observable<void> {
    return this.http
      .post<AuthResponse>(`${API_BASE_URL}/auth/register`, { email, password })
      .pipe(
        tap(response => {
          localStorage.setItem('token', response.token);
          this._token.set(response.token);
        }),
        map(() => void 0)
      );
  }

  login(email: string, password: string): Observable<void> {
    return this.http
      .post<AuthResponse>(`${API_BASE_URL}/auth/login`, { email, password })
      .pipe(
        tap(response => {
          localStorage.setItem('token', response.token);
          this._token.set(response.token);
        }),
        map(() => void 0)
      );
  }

  getProfile(): Observable<UserProfile> {
    return this.http
      .get<UserProfile>(`${API_BASE_URL}/users/me`)
      .pipe(tap(profile => this._currentUser.set(profile)));
  }

  updateProfile(displayName: string, email: string): Observable<UserProfile> {
    return this.http
      .patch<UserProfile>(`${API_BASE_URL}/users/me`, { displayName, email })
      .pipe(tap(profile => this._currentUser.set(profile)));
  }

  getToken(): string | null {
    return this._token();
  }

  logout(): void {
    localStorage.removeItem('token');
    this._token.set(null);
    this._currentUser.set(null);
  }
}
