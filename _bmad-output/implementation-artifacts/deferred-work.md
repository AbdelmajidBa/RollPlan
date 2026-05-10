# Deferred Work

## Deferred from: code review of stories 2-3, 2-4, 2-5, 3-1 (2026-05-10)

- **MIME-type validation trusts client `Content-Type` header** (2-3) — `IFormFile.ContentType` is caller-supplied and not verified against file magic bytes. Server-side magic-byte inspection needed before public launch.
- **`UpdateTripAsync` old cover image orphaned on storage delete failure** (2-3) — if `DeleteFileAsync` throws after `SaveChangesAsync`, the old image URL is permanently orphaned. Address with background cleanup job or eventual-consistency pattern.
- **SortOrder race condition in `AddStepAsync`** (3-1) — two concurrent POST requests for the same trip both read the same `maxOrder` and produce duplicate `SortOrder` values. Fix with a DB-level unique index on `(trip_id, sort_order)` or serializable transaction.
- **`POST /trips/{tripId}/steps` returns 201 without `Location` header** (3-1) — no single-step GET endpoint exists; `CreatedAtAction` cannot be used until a `GetStep` route is added.
- **`StartTime` accepts arbitrary string formats** (3-1) — only HTML `<input type="time">` enforces HH:mm on the client. Add server-side regex validation in `CreateStepRequestValidator`.
- **`StepType` enum default (0=Travel) accepted when field is absent** (3-1) — `IsInEnum()` cannot distinguish an absent field from an intentional `Travel`. Change DTO to `StepType?` to make absence detectable.

## Deferred from: code review of 2-1-create-trip (2026-05-09)

- **GetCurrentUserId throws UnauthorizedAccessException** — pre-existing pattern across all controllers; should map to 401 via middleware. Address in a cross-cutting security hardening pass.
- **MIME-type spoofing on file uploads** — ContentType is client-supplied and not verified against magic bytes. Revisit with server-side magic-byte inspection before public launch.
- **GetTrip placeholder returns 404** — Location header broken; will be resolved when Story 2.3 (view trip detail) is implemented.
- **TripListComponent shows empty list on fresh page load** — session-only signal, no GET /trips. Full listing is Story 2.2 scope.
- **TripDetailComponent is a placeholder** — Epic 3 scope.
- **No CancellationToken propagated** — pre-existing pattern; address in performance/resilience pass.
- **Timestamp equality test coupled to implementation** — low risk; refactor if timestamps are ever set independently.

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
