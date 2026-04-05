# Deferred Work

## Deferred from: code review of 1-1-initialize-monorepo-and-project-scaffolding (2026-04-05)

- `appsettings.json` retains .NET built-in `Logging` section — silently ignored by Serilog. Clean up when adding full Serilog config in Story 1.2.
- CORS `AllowAngularDev` policy hardcoded to `localhost:4200` — production frontend domain will be CORS-blocked. Must add configurable prod origin (from appsettings) before deploying to production. Address in deployment/infrastructure story.

## Deferred from: code review of 1-3-user-registration (2026-04-05)

- Token issued without email verification — v1 intentional design, no email confirmation planned in scope. Revisit if email verification is added post-MVP.
- No client-side JWT expiry check in `auth.service.ts` — `isAuthenticated` computed from token presence only, not expiry. 401 interceptor with auto-logout planned in Story 1.4 (error interceptor).
- `localStorage` SSR guard in `auth.service.ts` signal initializer — SPA only, no Angular Universal in project scope. Guard with `isPlatformBrowser` if SSR ever added.
- `DisplayName` set to empty string in JWT `Name` claim at registration — intentional. User sets display name in Story 1.5 (profile edit).
- JWT ExpiryDays configurable via `Jwt:ExpiryDays` config key — architecture mandates 7-day token but configurable is acceptable for v1 personal project; 7-day default is maintained in code and config.

## Deferred from: code review of 1-4-user-login-and-logout (2026-04-05)

- `authGuard` always redirects to `/trips` after login — no `returnUrl` captured. Users who follow a deep link lose their destination. Implement `returnUrl` query-param round-trip when a dedicated UX story warrants it.
- No wildcard `**` → 404 route in `app.routes.ts` — unknown paths fall through silently. Add a `NotFoundComponent` route in a future routing cleanup story.
- Concurrent login requests not deduplicated in `LoginComponent` — double-submit guard (`isLoading`) prevents most cases; the edge case of a programmatic double-call is negligible for an SPA. Revisit if needed post-MVP.

## Deferred from: code review of 1-5-user-profile-view-and-edit (2026-04-05)

- Stale JWT after email/displayName change — `PATCH /users/me` does not re-issue the token or invalidate the old one via security stamp. The 7-day token continues to carry old `email` and `name` claims. Mitigate post-MVP by embedding security stamp in JWT claims and validating it on each request, or by switching to short-lived access tokens with refresh.
- `localStorage` JWT storage is XSS-extractable — pre-existing v1 design choice (also deferred in Story 1.3). Revisit with `httpOnly` cookies or short-lived tokens before any public launch.
- `ProfileComponent` form not disabled during initial `getProfile()` load — a slow network response allows `patchValue()` to silently overwrite in-progress user edits. Fix: `form.disable()` on load start, `form.enable()` in `finalize`. Low priority for a personal project.
- Success banner in `ProfileComponent` not cleared when user resumes editing after a successful save — stale "Profile updated" message coexists with unsaved edits. Fix: subscribe to `form.valueChanges` and clear `successMessage`. UX polish.
- `UsersController` has no unit or integration tests — the `ProblemDetails.Detail` contract between the controller and the Angular client is validated only at the service layer. Add controller integration tests (WebApplicationFactory) before the API has multiple consumers.
- `isSaving` double-submit guard in `ProfileComponent.onSubmit` has no test — trivial one-liner guard, low defect risk.
