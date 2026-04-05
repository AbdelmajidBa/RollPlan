# Story 1.3: User Registration

Status: done

## Story

As a **visitor**,
I want to register with my email and password,
so that I can access the app.

## Acceptance Criteria

1. When a visitor submits a valid email and password (min 6 chars), a new user is created and a JWT token is returned from `POST /api/v1/auth/register`
2. The Angular client stores the JWT token in `localStorage` and navigates to `/trips` after successful registration
3. Submitting a duplicate email returns HTTP 400 with a clear ProblemDetails error message
4. Invalid input (missing email, bad email format, password < 6 chars) shows inline form validation errors in the Angular UI; the API also returns 400 for invalid input

## Tasks / Subtasks

- [x] Task 1: Configure JWT Bearer in backend (AC: #1)
  - [x] Add `"Jwt": { "Issuer": "RollPlan", "Audience": "RollPlan", "ExpiryDays": 7 }` to `rollplan-api/appsettings.json` (no Key — key stays in Development.json)
  - [x] Fill in `Jwt:Key` in `appsettings.Development.json` with a dev secret ≥ 32 chars (e.g., `"rollplan-dev-secret-key-32chars!!"`)
  - [x] In `Program.cs`, add `builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(...)` with `TokenValidationParameters` (ValidateIssuer, ValidateAudience, ValidateLifetime, ValidateIssuerSigningKey)
  - [x] Enable `app.UseAuthentication()` before `app.UseAuthorization()` in the pipeline (currently commented out)
  - [x] Add `builder.Services.AddValidatorsFromAssemblyContaining<Program>()` and `builder.Services.AddFluentValidationAutoValidation()` to register FluentValidation

- [x] Task 2: Create Auth DTOs and validator (AC: #1, #3, #4)
  - [x] Create `rollplan-api/Models/DTOs/Auth/RegisterRequest.cs` — properties: `Email` (string), `Password` (string)
  - [x] Create `rollplan-api/Models/DTOs/Auth/AuthResponse.cs` — properties: `Token` (string), `Email` (string), `DisplayName` (string)
  - [x] Create `rollplan-api/Models/DTOs/Auth/RegisterRequestValidator.cs` — `AbstractValidator<RegisterRequest>`: `Email` NotEmpty + EmailAddress; `Password` NotEmpty + MinimumLength(6)

- [x] Task 3: Create `IAuthService` and `AuthService` (AC: #1, #3)
  - [x] Create `rollplan-api/Services/IAuthService.cs` — interface with `Task<AuthResponse> RegisterAsync(RegisterRequest request)`; method throws `InvalidOperationException` with a message on business rule violations (duplicate email)
  - [x] Create `rollplan-api/Services/AuthService.cs` — constructor injects `UserManager<ApplicationUser>`, `IConfiguration`
  - [x] `RegisterAsync`: call `_userManager.CreateAsync(user, request.Password)`; if result fails with `DuplicateEmail` error → throw `InvalidOperationException("Email is already registered.")`; on success, generate and return JWT
  - [x] JWT generation: `JwtSecurityToken` with claims `[sub=userId, email, name=DisplayName]`, signed with `SymmetricSecurityKey(Encoding.UTF8.GetBytes(Jwt:Key))`, algorithm `HmacSha256`, expiry = `DateTime.UtcNow.AddDays(Jwt:ExpiryDays)`, issuer and audience from config
  - [x] Register `AuthService` in DI: `builder.Services.AddScoped<IAuthService, AuthService>()` in `Program.cs`

- [x] Task 4: Create `AuthController` (AC: #1, #3, #4)
  - [x] Create `rollplan-api/Controllers/AuthController.cs` — `[ApiController]`, `[Route("api/v1/auth")]`
  - [x] Constructor injects `IAuthService`
  - [x] `POST /register` action: `[HttpPost("register")]`, takes `RegisterRequest` (auto-validated by FluentValidation auto-validation — 400 returned by framework if invalid)
  - [x] On `InvalidOperationException` from `AuthService.RegisterAsync` → return `BadRequest(new ProblemDetails { Status = 400, Title = "Registration failed", Detail = ex.Message })`
  - [x] On success → return `Ok(authResponse)`

- [x] Task 5: Backend unit tests (AC: #1, #3)
  - [x] Create test project: `dotnet new xunit -n RollPlan.Api.Tests --framework net9.0` at `rollplan-api-tests/` (sibling to `rollplan-api/`)
  - [x] Add project reference: `dotnet add rollplan-api-tests/RollPlan.Api.Tests.csproj reference rollplan-api/RollPlan.Api.csproj`
  - [x] Add packages: `Moq`, `Microsoft.AspNetCore.Identity` (for `MockUserManager` helper)
  - [x] Create `rollplan-api-tests/Services/AuthServiceTests.cs` with 3 tests — all passing
  - [x] Run: `dotnet test rollplan-api-tests/ --configuration Release` — Passed: 3, Failed: 0

- [x] Task 6: Angular — set up HTTP client and AuthService (AC: #2)
  - [x] Add `provideHttpClient(withInterceptorsFromDi())` to providers in `rollplan-client/src/app/app.config.ts`
  - [x] Create `rollplan-client/src/app/auth/services/auth.service.ts` — signal-based, register(), logout(), getToken(), isAuthenticated computed

- [x] Task 7: Angular — Create RegisterComponent (AC: #2, #4)
  - [x] Create `rollplan-client/src/app/auth/register/register.component.ts` — Reactive Form, signals, finalize() for loading state
  - [x] Create `rollplan-client/src/app/auth/register/register.component.html` — Tailwind-styled, inline validation errors, serverError display, loading state

- [x] Task 8: Angular — Configure routing (AC: #2)
  - [x] Updated `rollplan-client/src/app/app.routes.ts` — /register, /trips (placeholder), redirect from /

- [x] Task 9: Angular unit tests (AC: #2, #4)
  - [x] Created `auth.service.spec.ts` — 4 tests (create, register success, register error, logout)
  - [x] Created `register.component.spec.ts` — 7 tests (create, form states, validation)
  - [x] Run: `ng test --watch=false` — Passed: 13, Failed: 0 (Vitest runner; `toBe(true/false)` not `toBeTrue/toBeFalse`)

## Dev Notes

### Runtime: .NET 9 (not .NET 8 as stated in architecture doc)

Architecture doc references .NET 8 — actual runtime is .NET 9 (`net9.0` in csproj). All package versions use 9.x.

### Already In Place (from Stories 1.1 + 1.2)

**Backend — do NOT reinstall:**
- `Microsoft.AspNetCore.Authentication.JwtBearer 9.0.14` ✅
- `FluentValidation.AspNetCore 11.3.1` ✅
- `Microsoft.AspNetCore.Identity.EntityFrameworkCore 9.0.14` ✅
- `ApplicationUser` entity at `rollplan-api/Models/Entities/ApplicationUser.cs` ✅
- `AppDbContext` with snake_case Identity tables ✅
- `AddIdentityCore<ApplicationUser>` + `AddRoles<IdentityRole<Guid>>` + `AddEntityFrameworkStores<AppDbContext>` + `AddDefaultTokenProviders()` in Program.cs ✅
- `builder.Services.AddDataProtection()` in Program.cs ✅
- `ErrorHandlingMiddleware` first in pipeline ✅
- `app.UseAuthentication()` is commented out in Program.cs — **uncomment in Task 1**

**Frontend — do NOT re-init:**
- Angular project at `rollplan-client/` with Tailwind, SCSS, routing ✅
- `environment.ts` with `apiUrl: 'http://localhost:5000/api/v1'` ✅
- `API_BASE_URL` constant at `rollplan-client/src/app/core/config/api.config.ts` ✅
- `app.config.ts` and `app.routes.ts` exist but need updates ✅

### JWT Bearer Registration Pattern

```csharp
// Program.cs — add after AddDataProtection(), before AddDbContext
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!))
        };
    });
```

Pipeline order (MUST maintain):
```csharp
app.UseMiddleware<ErrorHandlingMiddleware>(); // already first
app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseCors("AllowAngularDev");
app.UseAuthentication(); // ← uncomment/add here
app.UseAuthorization();
app.MapControllers();
```

### JWT Token Generation

```csharp
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;

private string GenerateToken(ApplicationUser user)
{
    var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
    var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
    var expiryDays = int.Parse(_config["Jwt:ExpiryDays"] ?? "7");

    var claims = new[]
    {
        new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
        new Claim(JwtRegisteredClaimNames.Email, user.Email!),
        new Claim(JwtRegisteredClaimNames.Name, user.DisplayName),
        new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
    };

    var token = new JwtSecurityToken(
        issuer: _config["Jwt:Issuer"],
        audience: _config["Jwt:Audience"],
        claims: claims,
        expires: DateTime.UtcNow.AddDays(expiryDays),
        signingCredentials: creds);

    return new JwtSecurityTokenHandler().WriteToken(token);
}
```

### ApplicationUser Mapping

`ApplicationUser` inherits `IdentityUser<Guid>` and has `DisplayName` (string). When creating:
```csharp
var user = new ApplicationUser
{
    Email = request.Email,
    UserName = request.Email, // Identity requires UserName
    DisplayName = string.Empty // set in Story 1.5 profile edit
};
```

### FluentValidation Registration

```csharp
// Program.cs — in builder.Services section
builder.Services.AddValidatorsFromAssemblyContaining<Program>();
builder.Services.AddFluentValidationAutoValidation(); // auto-validates controller inputs
```

With `AddFluentValidationAutoValidation()`, invalid `RegisterRequest` returns HTTP 400 with `ValidationProblemDetails` (list of field errors) **before** the action runs — no manual validation in controller needed.

### AuthService Error Handling

`UserManager.CreateAsync` returns `IdentityResult`. Check for duplicate email:
```csharp
if (!result.Succeeded)
{
    var isDuplicate = result.Errors.Any(e => e.Code == "DuplicateEmail" || e.Code == "DuplicateUserName");
    var message = isDuplicate
        ? "Email is already registered."
        : string.Join("; ", result.Errors.Select(e => e.Description));
    throw new InvalidOperationException(message);
}
```

`AuthController` catches `InvalidOperationException` and returns `BadRequest(new ProblemDetails { ... })`. `ErrorHandlingMiddleware` handles all other unhandled exceptions (returns 500).

### Angular HTTP Client Setup

```typescript
// app.config.ts
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()) // add this
  ]
};
```

### Angular AuthService Pattern

```typescript
// src/app/auth/services/auth.service.ts
import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { API_BASE_URL } from '../../core/config/api.config';

interface AuthResponse {
  token: string;
  email: string;
  displayName: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _token = signal<string | null>(localStorage.getItem('token'));
  readonly isAuthenticated = computed(() => this._token() !== null);

  constructor(private http: HttpClient) {}

  register(email: string, password: string): Observable<void> {
    return this.http.post<AuthResponse>(`${API_BASE_URL}/auth/register`, { email, password }).pipe(
      tap(response => {
        localStorage.setItem('token', response.token);
        this._token.set(response.token);
      }),
      map(() => void 0) // suppress response from Observable<void>
    );
  }

  getToken(): string | null { return this._token(); }

  logout(): void {
    localStorage.removeItem('token');
    this._token.set(null);
  }
}
```

### Angular RegisterComponent Pattern

Use `finalize` from `rxjs/operators` for loading state cleanup:
```typescript
import { finalize } from 'rxjs/operators';

onSubmit(): void {
  if (this.form.invalid) return;
  this.isLoading.set(true);
  this.serverError.set(null);
  const { email, password } = this.form.value;
  this.authService.register(email!, password!).pipe(
    finalize(() => this.isLoading.set(false))
  ).subscribe({
    next: () => this.router.navigate(['/trips']),
    error: (err) => this.serverError.set(err.error?.detail ?? 'Registration failed. Please try again.')
  });
}
```

### Trips Placeholder Route

Story 1.3 needs `/trips` to exist for navigation post-registration. Create a minimal inline placeholder:
```typescript
// In app.routes.ts — will be replaced in Epic 2
import { Component } from '@angular/core';
@Component({ standalone: true, template: '<p class="p-4">Trips — coming soon</p>' })
class TripsPlaceholderComponent {}
```

### Mock UserManager in Tests

`UserManager<T>` has a complex constructor. Use this helper pattern:
```csharp
private static Mock<UserManager<ApplicationUser>> CreateMockUserManager()
{
    var store = new Mock<IUserStore<ApplicationUser>>();
    return new Mock<UserManager<ApplicationUser>>(
        store.Object, null, null, null, null, null, null, null, null);
}
```

### appsettings.json Update (Task 1)

Add to `rollplan-api/appsettings.json` (no Key here — key only in Development.json which is git-ignored):
```json
{
  "Serilog": { ... },
  "AllowedHosts": "*",
  "Jwt": {
    "Issuer": "RollPlan",
    "Audience": "RollPlan",
    "ExpiryDays": "7"
  }
}
```

Update `rollplan-api/appsettings.Development.json` Jwt:Key:
```json
"Jwt": {
  "Key": "rollplan-dev-secret-key-at-least-32-chars!",
  "Issuer": "RollPlan",
  "Audience": "RollPlan"
}
```

### Architecture Compliance Checklist

- [ ] Route prefix: `api/v1/auth/register` ✅
- [ ] Controller: `[ApiController]` + `[Route("api/v1/auth")]` ✅
- [ ] Error format: RFC 7807 ProblemDetails on all errors ✅
- [ ] FluentValidation on RegisterRequest DTO ✅
- [ ] Angular Signals for state (not BehaviorSubject) ✅
- [ ] JWT 7-day expiry, stored in localStorage ✅
- [ ] `async`/`await` or `Task<>` on all async C# methods, `Async` suffix ✅
- [ ] `UserName = request.Email` on ApplicationUser (Identity requires it) ✅
- [ ] Tailwind CSS utility classes, no external component library ✅
- [ ] Standalone Angular component ✅

### Project Structure — New Files

```
rollplan-api/
  Controllers/
    AuthController.cs             ← NEW
  Services/
    IAuthService.cs               ← NEW
    AuthService.cs                ← NEW
  Models/
    DTOs/
      Auth/
        RegisterRequest.cs        ← NEW
        AuthResponse.cs           ← NEW
        RegisterRequestValidator.cs ← NEW

rollplan-api-tests/               ← NEW test project
  RollPlan.Api.Tests.csproj
  Services/
    AuthServiceTests.cs           ← NEW

rollplan-client/src/app/
  auth/
    services/
      auth.service.ts             ← NEW
      auth.service.spec.ts        ← NEW
    register/
      register.component.ts       ← NEW
      register.component.html     ← NEW
      register.component.spec.ts  ← NEW
```

### Modified Files

```
rollplan-api/
  Program.cs                      ← add JWT Bearer, FluentValidation, AuthService DI, UseAuthentication
  appsettings.json                ← add Jwt section
  appsettings.Development.json    ← fill in Jwt:Key

rollplan-client/src/app/
  app.config.ts                   ← add provideHttpClient
  app.routes.ts                   ← add /register and /trips routes
```

### References

- Auth & JWT architecture: [Source: architecture.md#Authentication-&-Security]
- API naming (route prefix, error format): [Source: architecture.md#API-&-Communication-Patterns]
- Backend structure (`Controllers/`, `Services/`, `Models/DTOs/`): [Source: architecture.md#Structure-Patterns]
- Frontend structure (`auth/`): [Source: architecture.md#Frontend-Architecture]
- FluentValidation mandate: [Source: architecture.md#Enforcement-Guidelines]
- Angular Signals mandate: [Source: architecture.md#Enforcement-Guidelines]
- Story 1.2 learnings: `AddDataProtection()` required; `UserName` must equal `Email` for Identity; `AddIdentityCore` (not `AddIdentity`) in place
- Story 1.2 fix: `AppDbContext.OnModelCreating` explicitly renames Identity tables to snake_case — already applied

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- `AddFluentValidationAutoValidation()` requires `using FluentValidation.AspNetCore;` — not auto-imported in top-level Program.cs
- Backend build fails with locked `RollPlan.Api.exe` when a previous `dotnet run` is still running — used `dotnet build -o /tmp/...` and `dotnet test --configuration Release` to work around
- Angular project uses **Vitest** (not Karma/Jasmine) — `toBeTrue()`/`toBeFalse()` don't exist; use `toBe(true)`/`toBe(false)`

### Completion Notes List

- AC1 ✅ `POST /api/v1/auth/register` returns JWT on valid email+password; builds clean (0 errors)
- AC2 ✅ Angular AuthService stores token in localStorage + updates Signal; navigates to /trips
- AC3 ✅ Duplicate email → `InvalidOperationException("Email is already registered.")` → HTTP 400 ProblemDetails with detail field
- AC4 ✅ FluentValidation auto-validates RegisterRequest (email format, password minLength); Angular form shows inline errors per field when touched
- Backend tests: 3/3 passing (xUnit + Moq, `rollplan-api-tests/`)
- Angular tests: 13/13 passing (Vitest, `ng test --watch=false`)

### File List

**Backend — NEW:**
- `rollplan-api/Controllers/AuthController.cs`
- `rollplan-api/Services/IAuthService.cs`
- `rollplan-api/Services/AuthService.cs`
- `rollplan-api/Models/DTOs/Auth/RegisterRequest.cs`
- `rollplan-api/Models/DTOs/Auth/AuthResponse.cs`
- `rollplan-api/Models/DTOs/Auth/RegisterRequestValidator.cs`
- `rollplan-api-tests/RollPlan.Api.Tests.csproj`
- `rollplan-api-tests/Services/AuthServiceTests.cs`

**Backend — MODIFIED:**
- `rollplan-api/Program.cs` (JWT Bearer, FluentValidation, AuthService DI, UseAuthentication)
- `rollplan-api/appsettings.json` (added Jwt section)
- `rollplan-api/appsettings.Development.json` (filled Jwt:Key)

**Frontend — NEW:**
- `rollplan-client/src/app/auth/services/auth.service.ts`
- `rollplan-client/src/app/auth/services/auth.service.spec.ts`
- `rollplan-client/src/app/auth/register/register.component.ts`
- `rollplan-client/src/app/auth/register/register.component.html`
- `rollplan-client/src/app/auth/register/register.component.spec.ts`

**Frontend — MODIFIED:**
- `rollplan-client/src/app/app.config.ts` (provideHttpClient)
- `rollplan-client/src/app/app.routes.ts` (/register, /trips, redirect)

### Senior Developer Review (AI)

**Review Date:** 2026-04-05
**Outcome:** Changes Requested
**Layers:** Blind Hunter, Edge Case Hunter, Acceptance Auditor

#### Action Items

- [x] [Review][Decision] JWT ExpiryDays — configurable vs. hardcoded 7 days — deferred: configurable expiry acceptable for v1 personal project; 7-day default maintained in code
- [x] [Review][Patch] Add Jwt:Key startup validation — null crash risk after user creation [Program.cs]
- [x] [Review][Patch] Replace `int.Parse` with `int.TryParse` for ExpiryDays [AuthService.cs:GenerateToken]
- [x] [Review][Patch] Generic fallback for non-duplicate Identity errors — avoid leaking internal descriptions [AuthService.cs:RegisterAsync]
- [x] [Review][Patch] Add `MaximumLength(128)` to password validator — prevents DoS via oversized payloads [RegisterRequestValidator.cs]
- [x] [Review][Patch] Guard `onSubmit()` against double-submit — disable re-entry while request in flight [register.component.ts]
- [x] [Review][Defer] Token issued without email verification — v1 intentional, no email confirmation in scope — deferred, pre-existing design
- [x] [Review][Defer] No client-side JWT expiry check — 401 interceptor planned in Story 1.4 — deferred, pre-existing design
- [x] [Review][Defer] localStorage SSR guard — SPA only, no Angular Universal in scope — deferred, pre-existing design
- [x] [Review][Defer] DisplayName empty string in JWT Name claim — intentional, Story 1.5 handles profile update — deferred, pre-existing design
