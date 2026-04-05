# Story 1.4: User Login and Logout

Status: done

## Story

As a **registered user**,
I want to log in with my email and password and log out when done,
So that my trips are securely accessible only to me.

## Acceptance Criteria

1. When a registered user submits valid credentials to `POST /api/v1/auth/login`, a JWT token is returned, stored in `localStorage`, and the user is navigated to `/trips`
2. Invalid credentials (wrong email or password) return HTTP 401 with a clear ProblemDetails error message; the Angular login form shows the server error
3. The Angular auth guard redirects unauthenticated users away from `/trips` to `/login`
4. Logging out clears the JWT from `localStorage` and redirects to `/login` (logout is already implemented in `AuthService.logout()` — only routing update needed)
5. The JWT HTTP interceptor attaches `Authorization: Bearer {token}` to all outgoing requests
6. The error interceptor catches HTTP 401 responses on authenticated requests (when a token is present), clears the token, and redirects to `/login`

## Tasks / Subtasks

- [x] Task 1: Backend — Add LoginAsync to IAuthService + AuthService (AC: #1, #2)
  - [x] Add `Task<AuthResponse> LoginAsync(LoginRequest request)` to `rollplan-api/Services/IAuthService.cs`
  - [x] Implement `LoginAsync` in `rollplan-api/Services/AuthService.cs`:
    - Call `_userManager.FindByEmailAsync(request.Email)` — if null → throw `UnauthorizedAccessException("Invalid email or password.")`
    - Call `_userManager.CheckPasswordAsync(user, request.Password)` — if false → throw `UnauthorizedAccessException("Invalid email or password.")`
    - On success → call existing `GenerateToken(user)` and return `new AuthResponse { Token, Email = user.Email!, DisplayName = user.DisplayName }`
  - [x] **CRITICAL: Always use the same generic message** `"Invalid email or password."` for both user-not-found and wrong-password — never reveal which one failed

- [x] Task 2: Backend — Create LoginRequest DTO + Validator (AC: #1, #2)
  - [x] Create `rollplan-api/Models/DTOs/Auth/LoginRequest.cs` — properties: `Email` (string), `Password` (string)
  - [x] Create `rollplan-api/Models/DTOs/Auth/LoginRequestValidator.cs` — `AbstractValidator<LoginRequest>`:
    - `Email`: `NotEmpty()` + `EmailAddress()` (same as RegisterRequestValidator)
    - `Password`: `NotEmpty()` only — **no MinimumLength on login** (user may have pre-existing password)

- [x] Task 3: Backend — Add login endpoint to AuthController (AC: #1, #2)
  - [x] Add `[HttpPost("login")]` action to `rollplan-api/Controllers/AuthController.cs`
  - [x] Catch `UnauthorizedAccessException` → return `Unauthorized(new ProblemDetails { Type = "https://tools.ietf.org/html/rfc7807", Title = "Login failed.", Status = 401, Detail = ex.Message })`
  - [x] On success → return `Ok(authResponse)`
  - [x] Controller already has `[AllowAnonymous]` at class level — no additional attribute needed

- [x] Task 4: Backend unit tests (AC: #1, #2)
  - [x] Add to `rollplan-api-tests/Services/AuthServiceTests.cs` (or new file):
    - `LoginAsync_ValidCredentials_ReturnsToken` — mock FindByEmail returning user, CheckPassword returning true
    - `LoginAsync_UserNotFound_ThrowsUnauthorizedAccessException`
    - `LoginAsync_WrongPassword_ThrowsUnauthorizedAccessException`
  - [x] Run: `dotnet test rollplan-api-tests/ --configuration Release` — Passed: 6, Failed: 0

- [x] Task 5: Angular — Add login() to AuthService (AC: #1)
  - [x] Edit `rollplan-client/src/app/auth/services/auth.service.ts`:
    - Add `login(email: string, password: string): Observable<void>` method — same pattern as `register()`:
      ```typescript
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
      ```

- [x] Task 6: Angular — Create LoginComponent (AC: #1, #2)
  - [x] Create `rollplan-client/src/app/auth/login/login.component.ts` — mirror RegisterComponent structure exactly:
    - `isLoading = signal(false)`, `serverError = signal<string | null>(null)`
    - Reactive Form: `email` (required + email), `password` (required only — no minLength on login)
    - `onSubmit()` with double-submit guard (`if (this.isLoading()) return;`)
    - `finalize(() => this.isLoading.set(false))`
    - On success: `this.router.navigate(['/trips'])`
    - On error: `this.serverError.set(err.error?.detail ?? 'Login failed. Please try again.')`
  - [x] Create `rollplan-client/src/app/auth/login/login.component.html` — Tailwind-styled form:
    - Email field with inline validation errors (same pattern as register form)
    - Password field (no minLength error needed)
    - Server error display block
    - Submit button with loading state
    - Link to `/register` for users without account

- [x] Task 7: Angular — Create auth guard (AC: #3)
  - [x] Create `rollplan-client/src/app/auth/guards/auth.guard.ts` — functional guard:
    ```typescript
    import { inject } from '@angular/core';
    import { CanActivateFn, Router } from '@angular/router';
    import { AuthService } from '../services/auth.service';

    export const authGuard: CanActivateFn = () => {
      const authService = inject(AuthService);
      const router = inject(Router);
      if (authService.isAuthenticated()) return true;
      return router.createUrlTree(['/login']);
    };
    ```

- [x] Task 8: Angular — Create HTTP interceptors + update app.config.ts (AC: #5, #6)
  - [x] Create `rollplan-client/src/app/core/interceptors/auth.interceptor.ts`
  - [x] Create `rollplan-client/src/app/core/interceptors/error.interceptor.ts`
  - [x] Update `rollplan-client/src/app/app.config.ts` — `withInterceptors([authInterceptor, errorInterceptor])`

- [x] Task 9: Angular — Update routing (AC: #3, #4)
  - [x] Edit `rollplan-client/src/app/app.routes.ts`:
    - Add `/login` route → `LoginComponent`
    - Apply `canActivate: [authGuard]` to `/trips`
    - Change root redirect from `/register` to `/login`
    - Keep `/register` without guard (public)

- [x] Task 10: Angular unit tests (AC: #1, #2, #3, #5, #6)
  - [x] Update `rollplan-client/src/app/auth/services/auth.service.spec.ts` — added login() tests
  - [x] Create `rollplan-client/src/app/auth/login/login.component.spec.ts` — 7 tests
  - [x] Create `rollplan-client/src/app/auth/guards/auth.guard.spec.ts` — 2 tests
  - [x] Create `rollplan-client/src/app/core/interceptors/auth.interceptor.spec.ts` — 2 tests
  - [x] Create `rollplan-client/src/app/core/interceptors/error.interceptor.spec.ts` — 2 tests
  - [x] Run: `ng test --watch=false` — Passed: 29 (7 files), Failed: 0

## Dev Notes

### Already In Place (DO NOT reinstall or recreate)

**Backend:**
- `AuthService.GenerateToken()` — private method already exists, reuse it in `LoginAsync`
- `AuthController` at `rollplan-api/Controllers/AuthController.cs` — add `login` action to existing controller
- `AuthResponse` DTO at `rollplan-api/Models/DTOs/Auth/AuthResponse.cs` — reuse exactly as-is
- `IAuthService` at `rollplan-api/Services/IAuthService.cs` — add `LoginAsync` to existing interface
- `rollplan-api-tests/Services/AuthServiceTests.cs` — add tests here (or a new file)
- xUnit + Moq already configured in `rollplan-api-tests/`

**Frontend:**
- `AuthService` at `rollplan-client/src/app/auth/services/auth.service.ts` — has `register()`, `logout()`, `getToken()`, `isAuthenticated` — **add `login()` to existing file, do not recreate**
- `AuthResponse` interface already defined inside `auth.service.ts` — reuse it
- `API_BASE_URL` at `rollplan-client/src/app/core/config/api.config.ts` — same import as in `register()`
- `app.config.ts` and `app.routes.ts` exist — modify, do not recreate

### LoginRequest Validator — No MinimumLength

Do NOT add `MinimumLength(6)` to the LoginRequest password validator. The login endpoint validates credentials against the stored hash — FluentValidation on login only confirms the field isn't empty.

### AuthController — 401 vs 400 Pattern

- **Register:** `InvalidOperationException` → `BadRequest()` (400)
- **Login:** `UnauthorizedAccessException` → `Unauthorized()` (401)

```csharp
catch (UnauthorizedAccessException ex)
{
    return Unauthorized(new ProblemDetails
    {
        Type = "https://tools.ietf.org/html/rfc7807",
        Title = "Login failed.",
        Status = StatusCodes.Status401Unauthorized,
        Detail = ex.Message
    });
}
```

### Error Interceptor — Token-Presence Check

The 401 redirect guard `authService.getToken()` is critical:
- **Login attempt failure (401):** `getToken()` returns null → no redirect → error propagates to `LoginComponent` error callback → shows "Login failed" message ✅
- **Expired token on a trip request (401):** `getToken()` returns the token → logout + redirect to /login ✅

Without this check, a failed login attempt would redirect the user to `/login` while they're already on `/login` — causing a confusing loop.

### Functional Interceptors — app.config.ts Update

**Current (Story 1.3):**
```typescript
provideHttpClient(withInterceptorsFromDi())
```

**Required (Story 1.4):**
```typescript
import { withInterceptors } from '@angular/common/http';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';

provideHttpClient(withInterceptors([authInterceptor, errorInterceptor]))
```

Interceptor order matters: `authInterceptor` first (attaches token), `errorInterceptor` second (catches errors).

### Auth Guard — Functional (Angular 17+)

Do NOT use class-based `CanActivate` guard. Use `CanActivateFn` functional guard. No `implements CanActivate`, no `@Injectable` — just a plain exported function.

### Mock UserManager in LoginAsync Tests

Reuse the `CreateMockUserManager()` helper already in `AuthServiceTests.cs`:
```csharp
private static Mock<UserManager<ApplicationUser>> CreateMockUserManager() { ... }
```

For `LoginAsync` tests, mock these two methods:
```csharp
mockUserManager.Setup(m => m.FindByEmailAsync(It.IsAny<string>()))
    .ReturnsAsync((ApplicationUser?)null); // user not found

mockUserManager.Setup(m => m.CheckPasswordAsync(It.IsAny<ApplicationUser>(), It.IsAny<string>()))
    .ReturnsAsync(false); // wrong password
```

### Angular Testing — Vitest Rules

Project uses **Vitest** (NOT Karma/Jasmine):
- `toBe(true)` and `toBe(false)` — NEVER `toBeTrue()` or `toBeFalse()`
- Run tests: `ng test --watch=false`
- Test runner reads `vitest.config.ts` or `angular.json` test config

### Routes Update — Complete New State

```typescript
export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'trips', component: TripsPlaceholderComponent, canActivate: [authGuard] }
];
```

### Architecture Compliance Checklist

- [ ] `POST /api/v1/auth/login` returns 401 (not 400) for invalid credentials
- [ ] Generic error message — never reveals whether email or password was wrong
- [ ] Functional guard (`CanActivateFn`) not class-based
- [ ] Functional interceptors (`HttpInterceptorFn`) not class-based
- [ ] `withInterceptors([...])` in `provideHttpClient` (not DI-based)
- [ ] `AuthService.logout()` reused — not reimplemented
- [ ] `GenerateToken()` reused from existing `AuthService`
- [ ] RFC 7807 ProblemDetails on all API errors
- [ ] Angular Signals for state (not BehaviorSubject)
- [ ] All new async C# methods have `Async` suffix

### Project Structure — New Files

```
rollplan-api/
  Models/
    DTOs/
      Auth/
        LoginRequest.cs             ← NEW
        LoginRequestValidator.cs    ← NEW

rollplan-api-tests/
  Services/
    AuthServiceTests.cs             ← MODIFIED (add login tests)

rollplan-client/src/app/
  auth/
    login/
      login.component.ts            ← NEW
      login.component.html          ← NEW
      login.component.spec.ts       ← NEW
    guards/
      auth.guard.ts                 ← NEW
      auth.guard.spec.ts            ← NEW
    services/
      auth.service.ts               ← MODIFIED (add login())
      auth.service.spec.ts          ← MODIFIED (add login tests)
  core/
    interceptors/
      auth.interceptor.ts           ← NEW
      auth.interceptor.spec.ts      ← NEW
      error.interceptor.ts          ← NEW
      error.interceptor.spec.ts     ← NEW
```

### Modified Files

```
rollplan-api/
  Controllers/AuthController.cs     ← add /login action
  Services/IAuthService.cs          ← add LoginAsync signature
  Services/AuthService.cs           ← add LoginAsync implementation

rollplan-client/src/app/
  app.config.ts                     ← withInterceptors([auth, error])
  app.routes.ts                     ← /login route, authGuard on /trips, redirect to /login
```

### References

- Auth patterns: [Source: architecture.md#Authentication-&-Security]
- Interceptors: [Source: architecture.md#Frontend-Architecture] — `core/interceptors/auth.interceptor.ts` + `error.interceptor.ts`
- Guard location: [Source: architecture.md#Structure-Patterns] — `auth/guards/`
- Error format: [Source: architecture.md#API-&-Communication-Patterns] — RFC 7807 ProblemDetails
- Story 1.3 learnings: `AuthService.GenerateToken()` private method, `finalize()` pattern, Vitest requires `toBe(true)` not `toBeTrue()`

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- Vitest (not Jasmine) — `jasmine.createSpyObj` / `jasmine.SpyObj` don't exist. Use `vi.fn()` from `vitest` and plain stubs for Vitest specs.
- Guard spec return type: `authGuard` returns `MaybeAsync<GuardResult>`, not `boolean | UrlTree` — typed the helper function as untyped to avoid TS error.
- `RegisterAsync_OtherIdentityError` test was asserting the old internal error description. Updated to assert the generic message "Registration failed. Please check your input and try again." (Story 1.3 P3 patch — test hadn't been updated).

### Completion Notes List

- AC1 ✅ `POST /api/v1/auth/login` returns JWT on valid credentials; `401 + ProblemDetails` on invalid credentials
- AC2 ✅ Invalid credentials: `UnauthorizedAccessException("Invalid email or password.")` → 401 ProblemDetails; `LoginComponent` shows `serverError`
- AC3 ✅ `authGuard` (`CanActivateFn`) redirects unauthenticated users to `/login`; applied to `/trips` route
- AC4 ✅ `AuthService.logout()` already existed; routes redirect to `/login` after logout
- AC5 ✅ `authInterceptor` attaches `Authorization: Bearer {token}` to all outgoing requests when token present
- AC6 ✅ `errorInterceptor` catches 401 when token is present → logs out + navigates to `/login`; no redirect on 401 without token (login failure)
- Backend tests: 6/6 passing (xUnit + Moq)
- Angular tests: 29/29 passing across 7 files (Vitest)

### File List

**Backend — NEW:**
- `rollplan-api/Models/DTOs/Auth/LoginRequest.cs`
- `rollplan-api/Models/DTOs/Auth/LoginRequestValidator.cs`

**Backend — MODIFIED:**
- `rollplan-api/Services/IAuthService.cs` (added LoginAsync signature)
- `rollplan-api/Services/AuthService.cs` (added LoginAsync implementation)
- `rollplan-api/Controllers/AuthController.cs` (added /login action)
- `rollplan-api-tests/Services/AuthServiceTests.cs` (added 3 LoginAsync tests, fixed OtherIdentityError assertion)

**Frontend — NEW:**
- `rollplan-client/src/app/auth/login/login.component.ts`
- `rollplan-client/src/app/auth/login/login.component.html`
- `rollplan-client/src/app/auth/login/login.component.spec.ts`
- `rollplan-client/src/app/auth/guards/auth.guard.ts`
- `rollplan-client/src/app/auth/guards/auth.guard.spec.ts`
- `rollplan-client/src/app/core/interceptors/auth.interceptor.ts`
- `rollplan-client/src/app/core/interceptors/auth.interceptor.spec.ts`
- `rollplan-client/src/app/core/interceptors/error.interceptor.ts`
- `rollplan-client/src/app/core/interceptors/error.interceptor.spec.ts`

**Frontend — MODIFIED:**
- `rollplan-client/src/app/auth/services/auth.service.ts` (added login() method)
- `rollplan-client/src/app/auth/services/auth.service.spec.ts` (added login() tests)
- `rollplan-client/src/app/app.config.ts` (withInterceptors([authInterceptor, errorInterceptor]))
- `rollplan-client/src/app/app.routes.ts` (/login route, authGuard on /trips, redirect to /login)

## Senior Developer Review

**Reviewer:** bmad-code-review (claude-sonnet-4-6) — 2026-04-05
**Outcome:** CLEAN — 0 patches, 0 decisions needed

### Dismissed Findings (False Positives / By Design)

| Finding | Reason |
|---------|--------|
| JWT null-dereference in GenerateToken | Covered by Story 1.3 P1 patch — `user.Email!` null-forgiving operator is correct here |
| LoginRequest no MinimumLength on password | Intentional — login validates credentials, not password policy (documented in Dev Notes) |
| TripsPlaceholderComponent in routes | Temporary scaffold — acknowledged and expected until Epic 2 |
| Double-navigate on stale-token login | Acceptable behavior — user lands on /login which is the correct destination |
| errorInterceptor 401 race condition | Theoretical only — Angular HTTP pipeline serializes naturally; no real concurrency issue |
| ProblemDetails fields camelCase in JSON | Correct — ASP.NET Core default JSON serialization; matches Angular client reading `err.error?.detail` |
| FluentValidation 400 vs 401 concern | Correct — register (InvalidOperationException) → 400; login (UnauthorizedAccessException) → 401; pattern is intentional |
| navigate vs createUrlTree in guard | Style preference only — both are valid; createUrlTree preferred for testability (as implemented) |

### Deferred Findings

| Finding | Deferred To |
|---------|------------|
| No `returnUrl` captured in authGuard — users redirected to /trips unconditionally after login | Post-MVP or dedicated UX story |
| No wildcard `**` → 404 route in app.routes.ts | Out of scope for 1.4; add in a routing cleanup story |
| Concurrent login requests not deduplicated in LoginComponent | Low risk for SPA; address if needed post-MVP |
| No explicit logout UI trigger in this story | Story 1.5 (profile view) — already in scope |
