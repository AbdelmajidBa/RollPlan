# Story 1.5: User Profile View and Edit

Status: done

## Story

As an **authenticated user**,
I want to view and edit my profile (display name, email),
So that my account information is up to date.

## Acceptance Criteria

1. When an authenticated user navigates to `/profile`, their current display name and email are shown, pre-populated in an editable form
2. Submitting valid changes to display name saves successfully and shows a success confirmation
3. Attempting to change to an email already registered to another account returns a 400 with a clear error message shown on the form
4. The profile page is protected by the auth guard (unauthenticated users are redirected to `/login`)
5. The profile page is accessible from the main navigation bar, which is visible on all authenticated pages
6. Logging out from the navigation bar clears the token and redirects to `/login`

## Tasks / Subtasks

- [x] Task 1: Backend — Create ProfileResponse + UpdateProfileRequest DTOs + Validator (AC: #1, #2, #3)
  - [x] Create `rollplan-api/Models/DTOs/Users/ProfileResponse.cs` — `{ string Email, string DisplayName }`
  - [x] Create `rollplan-api/Models/DTOs/Users/UpdateProfileRequest.cs` — `{ string DisplayName, string Email }`
  - [x] Create `rollplan-api/Models/DTOs/Users/UpdateProfileRequestValidator.cs`:
    - `DisplayName`: `NotEmpty()` with message `"Display name is required."`
    - `Email`: `NotEmpty()` + `EmailAddress()` (same pattern as RegisterRequestValidator)

- [x] Task 2: Backend — Create IUserService + UserService (AC: #1, #2, #3)
  - [x] Create `rollplan-api/Services/IUserService.cs` with two methods:
    ```csharp
    Task<ProfileResponse> GetProfileAsync(Guid userId);
    Task<ProfileResponse> UpdateProfileAsync(Guid userId, UpdateProfileRequest request);
    ```
  - [x] Implement `rollplan-api/Services/UserService.cs`:
    - Constructor: `UserManager<ApplicationUser> userManager`
    - `GetProfileAsync`: `FindByIdAsync(userId.ToString())` → if null throw `InvalidOperationException("User not found.")` → return `ProfileResponse { Email = user.Email!, DisplayName = user.DisplayName }`
    - `UpdateProfileAsync`: see **Dev Notes → UpdateProfileAsync Implementation** for full algorithm

- [x] Task 3: Backend — Create UsersController (AC: #1, #2, #3, #4)
  - [x] Create `rollplan-api/Controllers/UsersController.cs`:
    - `[ApiController]`, `[Route("api/v1/users")]`, **`[Authorize]`** (NOT AllowAnonymous)
    - Constructor: inject `IUserService`
    - Helper: `GetCurrentUserId()` → extracts and parses Guid from JWT (see Dev Notes)
    - `[HttpGet("me")]` `GetProfile()` → calls `GetProfileAsync` → returns `Ok(response)`
    - `[HttpPatch("me")]` `UpdateProfile([FromBody] UpdateProfileRequest request)` → calls `UpdateProfileAsync` → returns `Ok(response)`, catches `InvalidOperationException` → returns `BadRequest(ProblemDetails { ... })`
  - [x] Register `IUserService` in `rollplan-api/Program.cs`:
    ```csharp
    builder.Services.AddScoped<IUserService, UserService>();
    ```

- [x] Task 4: Backend unit tests (AC: #1, #2, #3)
  - [x] Create `rollplan-api-tests/Services/UserServiceTests.cs`:
    - `GetProfileAsync_ValidUser_ReturnsProfileResponse`
    - `GetProfileAsync_UserNotFound_ThrowsInvalidOperationException`
    - `UpdateProfileAsync_DisplayNameChange_UpdatesAndReturnsProfile`
    - `UpdateProfileAsync_EmailChange_UpdatesEmailAndUsername`
    - `UpdateProfileAsync_DuplicateEmail_ThrowsInvalidOperationException`
    - `UpdateProfileAsync_SameEmail_DoesNotCheckForDuplicate` (no-op on email when unchanged)
    - `UpdateProfileAsync_UserNotFound_ThrowsInvalidOperationException`
  - [x] Run: `dotnet test rollplan-api-tests/ --configuration Release` — Passed: 13, Failed: 0

- [x] Task 5: Angular — Add profile methods + currentUser signal to AuthService (AC: #1, #2)
  - [x] Edit `rollplan-client/src/app/auth/services/auth.service.ts`:
    - Add `UserProfile` interface: `{ email: string; displayName: string }`
    - Add `private readonly _currentUser = signal<UserProfile | null>(null)`
    - Add `readonly currentUser = this._currentUser.asReadonly()`
    - Add `getProfile(): Observable<UserProfile>` — `GET ${API_BASE_URL}/users/me` → tap to `_currentUser.set(profile)`
    - Add `updateProfile(displayName: string, email: string): Observable<UserProfile>` — `PATCH ${API_BASE_URL}/users/me` → tap to `_currentUser.set(profile)`
  - [x] Also call `logout()` and `_currentUser.set(null)` together — update `logout()` to reset the user signal

- [x] Task 6: Angular — Create ProfileComponent (AC: #1, #2, #3, #4)
  - [x] Create `rollplan-client/src/app/auth/profile/profile.component.ts`
  - [x] Create `rollplan-client/src/app/auth/profile/profile.component.html`

- [x] Task 7: Angular — Create NavbarComponent (AC: #5, #6)
  - [x] Create `rollplan-client/src/app/shared/components/navbar/navbar.component.ts`
  - [x] Create `rollplan-client/src/app/shared/components/navbar/navbar.component.html`

- [x] Task 8: Angular — Update routing + app shell (AC: #4, #5)
  - [x] Edit `rollplan-client/src/app/app.routes.ts` — added `/profile` route with authGuard
  - [x] Edit `rollplan-client/src/app/app.html` — added `<app-navbar />` above `<router-outlet />`
  - [x] Edit `rollplan-client/src/app/app.ts` — added `NavbarComponent` to imports

- [x] Task 9: Angular unit tests (AC: #1, #2, #3, #5, #6)
  - [x] Update `rollplan-client/src/app/auth/services/auth.service.spec.ts` — added getProfile/updateProfile/logout-clears-user tests
  - [x] Create `rollplan-client/src/app/auth/profile/profile.component.spec.ts` — 6 tests
  - [x] Create `rollplan-client/src/app/shared/components/navbar/navbar.component.spec.ts` — 3 tests
  - [x] Fixed stale scaffold `app.spec.ts` (was checking for `h1` with old title)
  - [x] Run: `ng test --watch=false` — Passed: 42 (9 files), Failed: 0

## Dev Notes

### Already In Place (DO NOT reinstall or recreate)

**Backend:**
- `ApplicationUser` at `rollplan-api/Models/Entities/ApplicationUser.cs` — has `DisplayName` property, extends `IdentityUser<Guid>`
- `AuthService` + `IAuthService` — `UserManager<ApplicationUser>` already injected, `CreateMockUserManager()` helper in tests
- `AuthController` — example of `[Authorize]` vs `[AllowAnonymous]` patterns
- `FluentValidation` auto-validation — registered in Program.cs via `AddFluentValidationAutoValidation()`
- `ErrorHandlingMiddleware` — catches all unhandled exceptions and returns ProblemDetails

**Frontend:**
- `AuthService` at `rollplan-client/src/app/auth/services/auth.service.ts` — has `_token` signal, `isAuthenticated` computed, `getToken()`, `logout()`
- `authGuard` at `rollplan-client/src/app/auth/guards/auth.guard.ts` — functional `CanActivateFn`, apply to profile route
- `authInterceptor` at `rollplan-client/src/app/core/interceptors/auth.interceptor.ts` — attaches Bearer token automatically
- `API_BASE_URL` at `rollplan-client/src/app/core/config/api.config.ts`
- `app.routes.ts` — existing routes, add profile route here
- `app.html` — currently `<router-outlet />` only, add `<app-navbar />` above it

### JWT Claim Extraction in Controller

The JWT `sub` claim is set in `AuthService.GenerateToken()` as `user.Id.ToString()`. ASP.NET Core's JWT middleware maps `sub` to `ClaimTypes.NameIdentifier` by default (claim mapping is enabled). Extract the user ID in controllers like this:

```csharp
using System.Security.Claims;

private Guid GetCurrentUserId()
{
    var idStr = User.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? throw new InvalidOperationException("User identity claim missing.");
    return Guid.Parse(idStr);
}
```

Call this from `GetProfile()` and `UpdateProfile()` actions. If parsing fails, `Guid.Parse` will throw — this is caught by `ErrorHandlingMiddleware` and returns a 500. That's acceptable; a malformed JWT claim is a server-side bug.

### UpdateProfileAsync Implementation

```csharp
public async Task<ProfileResponse> UpdateProfileAsync(Guid userId, UpdateProfileRequest request)
{
    var user = await _userManager.FindByIdAsync(userId.ToString())
        ?? throw new InvalidOperationException("User not found.");

    // Always update DisplayName
    user.DisplayName = request.DisplayName;

    // Email change check
    var emailChanged = !string.Equals(request.Email, user.Email, StringComparison.OrdinalIgnoreCase);
    if (emailChanged)
    {
        var existing = await _userManager.FindByEmailAsync(request.Email);
        if (existing is not null)
            throw new InvalidOperationException("Email is already in use.");
    }

    if (emailChanged)
    {
        // SetEmailAsync calls UpdateAsync internally — also persists DisplayName change
        var setEmailResult = await _userManager.SetEmailAsync(user, request.Email);
        if (!setEmailResult.Succeeded)
            throw new InvalidOperationException("Failed to update email.");

        await _userManager.SetUserNameAsync(user, request.Email); // keep UserName = Email
    }
    else
    {
        // Only DisplayName changed — save explicitly
        var updateResult = await _userManager.UpdateAsync(user);
        if (!updateResult.Succeeded)
            throw new InvalidOperationException("Failed to update profile.");
    }

    return new ProfileResponse { Email = user.Email!, DisplayName = user.DisplayName };
}
```

**Key points:**
- `SetEmailAsync` saves the full user entity internally — this persists the `DisplayName` change when email also changes
- `SetUserNameAsync` must be called after `SetEmailAsync` because Identity requires `UserName == Email` (set at registration)
- When only DisplayName changes, call `UpdateAsync` explicitly
- `FindByEmailAsync` duplicate check uses the new email, not the current email — only check when email actually changed

### UsersController — [Authorize] Not [AllowAnonymous]

`AuthController` uses `[AllowAnonymous]` at class level. `UsersController` is the opposite — it uses `[Authorize]`:

```csharp
[ApiController]
[Route("api/v1/users")]
[Authorize]  // ← JWT required on all actions
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;

    public UsersController(IUserService userService)
    {
        _userService = userService;
    }

    private Guid GetCurrentUserId() { ... }

    [HttpGet("me")]
    public async Task<IActionResult> GetProfile()
    {
        var userId = GetCurrentUserId();
        var response = await _userService.GetProfileAsync(userId);
        return Ok(response);
    }

    [HttpPatch("me")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
    {
        var userId = GetCurrentUserId();
        try
        {
            var response = await _userService.UpdateProfileAsync(userId, request);
            return Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new ProblemDetails
            {
                Type = "https://tools.ietf.org/html/rfc7807",
                Title = "Profile update failed.",
                Status = StatusCodes.Status400BadRequest,
                Detail = ex.Message
            });
        }
    }
}
```

### AuthService — logout() Must Reset currentUser

When `logout()` is called, clear both the token and the user profile signal:

```typescript
logout(): void {
  localStorage.removeItem('token');
  this._token.set(null);
  this._currentUser.set(null);  // ← ADD THIS
}
```

### AuthService — New Profile Methods

Add after the existing `login()` method:

```typescript
export interface UserProfile {
  email: string;
  displayName: string;
}

// In the class body:
private readonly _currentUser = signal<UserProfile | null>(null);
readonly currentUser = this._currentUser.asReadonly();

getProfile(): Observable<UserProfile> {
  return this.http.get<UserProfile>(`${API_BASE_URL}/users/me`).pipe(
    tap(profile => this._currentUser.set(profile))
  );
}

updateProfile(displayName: string, email: string): Observable<UserProfile> {
  return this.http
    .patch<UserProfile>(`${API_BASE_URL}/users/me`, { displayName, email })
    .pipe(tap(profile => this._currentUser.set(profile)));
}
```

Note: `UserProfile` interface can be defined at module scope (after the existing `AuthResponse` interface in the file) or inline. Keep it local to the file — no need to export it unless consumed elsewhere.

### Angular — App Shell: Adding NavbarComponent

`app.html` currently only has `<router-outlet />`. The `AppComponent` (in `app.ts`) uses `templateUrl: './app.html'`. To use `<app-navbar />` in the template, `NavbarComponent` must be in `AppComponent`'s `imports` array.

Check `rollplan-client/src/app/app.ts` for the `AppComponent` definition — it should look like:

```typescript
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent],  // ← add NavbarComponent here
  templateUrl: './app.html',
})
export class AppComponent {}
```

And `app.html`:

```html
<app-navbar />
<router-outlet />
```

### Backend UserService Tests — Mocking UserManager

Reuse the `CreateMockUserManager()` helper from `AuthServiceTests.cs`. In addition to methods already mocked in auth tests, mock these for UserService:

```csharp
// GetProfileAsync
mockUserManager.Setup(m => m.FindByIdAsync(userId.ToString()))
    .ReturnsAsync(user);

// UpdateProfileAsync — email change
mockUserManager.Setup(m => m.FindByEmailAsync(newEmail))
    .ReturnsAsync((ApplicationUser?)null); // not duplicate
mockUserManager.Setup(m => m.SetEmailAsync(user, newEmail))
    .ReturnsAsync(IdentityResult.Success);
mockUserManager.Setup(m => m.SetUserNameAsync(user, newEmail))
    .ReturnsAsync(IdentityResult.Success);

// UpdateProfileAsync — displayName only
mockUserManager.Setup(m => m.UpdateAsync(user))
    .ReturnsAsync(IdentityResult.Success);
```

`FindByIdAsync` is NOT virtual by default in UserManager — you must mock on the Mock object that uses `Mock<UserManager<T>>` constructor. The `CreateMockUserManager()` helper already sets up the mock correctly for `MockBehavior.Default`, so all non-setup calls return null/default.

### Angular Testing — Profile Component

Use `HttpTestingController` (same pattern as `auth.service.spec.ts`) for service-level tests. For `ProfileComponent` unit tests, stub `AuthService`:

```typescript
const getProfileSpy = vi.fn();
const updateProfileSpy = vi.fn();
const authServiceStub = {
  getProfile: getProfileSpy,
  updateProfile: updateProfileSpy
};
```

Return Observables using `of(...)` from `rxjs` for success cases and `throwError(() => ...)` for error cases.

### Angular Testing — Vitest Rules (same as previous stories)

- `toBe(true)` / `toBe(false)` — NEVER `toBeTrue()` or `toBeFalse()`
- `vi.fn()` from `vitest` — NEVER `jasmine.createSpyObj`
- Run: `ng test --watch=false`

### Architecture Compliance Checklist

- [ ] `[Authorize]` on `UsersController` — NOT `[AllowAnonymous]`
- [ ] User ID extracted from JWT via `User.FindFirstValue(ClaimTypes.NameIdentifier)`
- [ ] `PATCH /api/v1/users/me` returns 400 (not 500) on duplicate email
- [ ] `SetUserNameAsync` called alongside `SetEmailAsync` to keep Identity UserName = Email
- [ ] RFC 7807 ProblemDetails on all API errors
- [ ] Angular Signals for all state (`isLoading`, `isSaving`, `serverError`, `successMessage`, `currentUser`)
- [ ] `finalize()` used to reset loading state in both `ngOnInit` and `onSubmit`
- [ ] `authGuard` applied to `/profile` route
- [ ] `NavbarComponent` only renders nav content when `isAuthenticated()` is true
- [ ] `logout()` in `AuthService` clears `_currentUser` signal
- [ ] All new async C# methods have `Async` suffix

### Project Structure — New Files

```
rollplan-api/
  Controllers/
    UsersController.cs                        ← NEW
  Services/
    IUserService.cs                           ← NEW
    UserService.cs                            ← NEW
  Models/DTOs/
    Users/
      ProfileResponse.cs                      ← NEW
      UpdateProfileRequest.cs                 ← NEW
      UpdateProfileRequestValidator.cs        ← NEW

rollplan-api-tests/
  Services/
    UserServiceTests.cs                       ← NEW

rollplan-client/src/app/
  auth/
    profile/
      profile.component.ts                    ← NEW
      profile.component.html                  ← NEW
      profile.component.spec.ts               ← NEW
  shared/
    components/
      navbar/
        navbar.component.ts                   ← NEW
        navbar.component.html                 ← NEW
        navbar.component.spec.ts              ← NEW
```

### Modified Files

```
rollplan-api/
  Program.cs                                  ← register IUserService

rollplan-client/src/app/
  auth/services/auth.service.ts               ← add currentUser signal, getProfile(), updateProfile(), fix logout()
  auth/services/auth.service.spec.ts          ← add getProfile/updateProfile tests
  app.routes.ts                               ← add /profile route
  app.html                                    ← add <app-navbar />
  app.ts                                      ← add NavbarComponent to imports
```

### References

- Auth patterns: [Source: architecture.md#Authentication-&-Security]
- Service patterns: [Source: architecture.md#Structure-Patterns] — controller-per-entity, service-per-domain
- Error format: [Source: architecture.md#API-&-Communication-Patterns] — RFC 7807 ProblemDetails
- Story 1.3/1.4 learnings: `finalize()` pattern, Vitest requires `toBe(true)` not `toBeTrue()`, functional guards, functional interceptors

### Review Findings

- [x] [Review][Patch] Remove TOCTOU duplicate-email pre-check; parse IdentityResult errors from SetEmailAsync instead [UserService.cs:UpdateProfileAsync]
- [x] [Review][Patch] Check SetUserNameAsync IdentityResult — silent failure leaves UserName/Email in split state [UserService.cs:UpdateProfileAsync]
- [x] [Review][Patch] Add MaximumLength(100) to DisplayName and MaximumLength(254) to Email in UpdateProfileRequestValidator; add Validators.maxLength to Angular form [UpdateProfileRequestValidator.cs, profile.component.ts]
- [x] [Review][Patch] Use Guid.TryParse instead of Guid.Parse in GetCurrentUserId() [UsersController.cs:GetCurrentUserId]
- [x] [Review][Patch] Add navbar profile link assertion to navbar.component.spec.ts (closes AC5 test gap) [navbar.component.spec.ts]
- [x] [Review][Defer] Stale JWT after email/displayName change — no re-issuance or security-stamp revocation [AuthService.cs:GenerateToken] — deferred, v1 design (7-day token, no refresh)
- [x] [Review][Defer] localStorage JWT storage is XSS-extractable [auth.service.ts] — deferred, pre-existing from Story 1.3
- [x] [Review][Defer] Form not disabled during initial profile load; patchValue overwrites in-progress edits [profile.component.ts:ngOnInit] — deferred, UX polish
- [x] [Review][Defer] Success banner not cleared when user re-edits after a successful save [profile.component.ts:onSubmit] — deferred, UX polish
- [x] [Review][Defer] UsersController has no tests; ProblemDetails.Detail contract untested at controller boundary — deferred, controller integration tests out of scope for v1
- [x] [Review][Defer] isSaving double-submit guard has no test [profile.component.spec.ts] — deferred, trivial guard
- [x] [Review][Defer] App shell navbar placement not asserted in app.spec.ts — deferred, low value

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- `NavbarComponent` spec: `RouterLink` requires `ActivatedRoute`. Providing `{ provide: Router, useValue: stub }` alone causes NG0201 error. Fix: use `provideRouter([])` + `vi.spyOn(router, 'navigate')` on the real injected Router — no Router stub override.
- `app.spec.ts`: had stale scaffold test checking `h1` containing `'Hello, rollplan-client'` — the title signal was removed from `AppComponent`. Fixed by removing the stale test and providing `provideRouter([])` + HTTP testing providers.
- `provideRouter([])` conflicts with `{ provide: Router, useValue: stub }` — they use different internal Router instances. The `RouterLink` directive resolves the real Router from the injector root, not the override stub. Always spy on the real Router rather than overriding it.

### Completion Notes List

- AC1 ✅ `GET /api/v1/users/me` returns current user profile; Angular ProfileComponent fetches and pre-populates form via `patchValue()`
- AC2 ✅ `PATCH /api/v1/users/me` with valid DisplayName updates and returns 200 + success message shown in UI
- AC3 ✅ Duplicate email returns `InvalidOperationException("Email is already in use.")` → 400 ProblemDetails; Angular shows `err.error?.detail` in serverError signal
- AC4 ✅ `/profile` route protected by `authGuard` — unauthenticated users redirected to `/login`
- AC5 ✅ `NavbarComponent` added to `app.html` shell; renders Trips/Profile links + Logout button only when `isAuthenticated()` is true
- AC6 ✅ `logout()` in NavbarComponent calls `authService.logout()` (clears token + currentUser signals) then navigates to `/login`
- Backend tests: 13/13 passing (6 existing + 7 new UserService tests)
- Angular tests: 42/42 passing across 9 files (Vitest)

### File List

**Backend — NEW:**
- `rollplan-api/Models/DTOs/Users/ProfileResponse.cs`
- `rollplan-api/Models/DTOs/Users/UpdateProfileRequest.cs`
- `rollplan-api/Models/DTOs/Users/UpdateProfileRequestValidator.cs`
- `rollplan-api/Services/IUserService.cs`
- `rollplan-api/Services/UserService.cs`
- `rollplan-api/Controllers/UsersController.cs`
- `rollplan-api-tests/Services/UserServiceTests.cs`

**Backend — MODIFIED:**
- `rollplan-api/Program.cs` (registered IUserService)

**Frontend — NEW:**
- `rollplan-client/src/app/auth/profile/profile.component.ts`
- `rollplan-client/src/app/auth/profile/profile.component.html`
- `rollplan-client/src/app/auth/profile/profile.component.spec.ts`
- `rollplan-client/src/app/shared/components/navbar/navbar.component.ts`
- `rollplan-client/src/app/shared/components/navbar/navbar.component.html`
- `rollplan-client/src/app/shared/components/navbar/navbar.component.spec.ts`

**Frontend — MODIFIED:**
- `rollplan-client/src/app/auth/services/auth.service.ts` (added UserProfile interface, currentUser signal, getProfile(), updateProfile(), logout() clears currentUser)
- `rollplan-client/src/app/auth/services/auth.service.spec.ts` (added getProfile, updateProfile, logout-clears-user tests)
- `rollplan-client/src/app/app.routes.ts` (added /profile route with authGuard)
- `rollplan-client/src/app/app.html` (added app-navbar)
- `rollplan-client/src/app/app.ts` (added NavbarComponent to imports, removed unused title signal)
- `rollplan-client/src/app/app.spec.ts` (fixed stale scaffold test)
