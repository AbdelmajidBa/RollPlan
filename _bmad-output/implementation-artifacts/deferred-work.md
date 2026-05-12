# Deferred Work

## Deferred from: code review of 4-4-toggle-between-map-and-list-view (2026-05-12)

- **`sessionStorage` calls not wrapped in try/catch** [`trip-detail.component.ts:ngOnInit,setView`] — throws `SecurityError` in Safari private browsing / ITP. v1 personal project; pre-existing SPA-wide pattern; address in a resilience pass before public launch.
- **`tripId` non-null asserted from route params without null guard** [`trip-detail.component.ts:ngOnInit`] — pre-existing across all detail components; not introduced by this story. Address in a general input-validation pass.

## Deferred from: code review of 4-3-tap-pin-to-open-step-details (2026-05-11)

- **XSS: step fields injected raw into Leaflet popup HTML** [`trip-map.component.ts:buildPopupHtml`] — `step.name`, `step.date`, `step.startTime` are template-interpolated directly into the HTML string passed to `bindPopup()`. No escaping or sanitization applied. Low risk for v1 (single-user; step data server-validated), but must be addressed with DOMPurify or a Content Security Policy before multi-user or public launch.
- **Popup HTML not reactive to `tripId` input changes post-bind** [`trip-map.component.ts:buildPopupHtml`] — Leaflet bakes the popup HTML string at `bindPopup()` call time. If `tripId` changes after markers are drawn, the "View in trip" link in existing popups will reflect the old value. In practice `tripId` is immutable for the life of the trip detail page (set once in `ngOnInit`), so this cannot trigger in current usage. Address if `TripMapComponent` is ever reused in a context where `tripId` changes dynamically.

## Deferred from: code review of 4-2-view-route-line-connecting-steps (2026-05-11)

- **No explicit test for AC #3/#4 (signal update triggers polyline redraw)** [`trip-map.component.spec.ts`] — The `effect()` mechanically covers reactive redraw, but there is no test that updates `stepsSignal` after component creation and asserts `L.polyline` is called again and the old polyline is removed. Same gap exists in story 4.1 for marker redraw. Address in a map-component test hardening pass.

## Deferred from: code review of 4-1-view-steps-as-map-pins (2026-05-11)

- **`markersLayer` initialized at field declaration before Leaflet map exists** [`trip-map.component.ts:18`] — `L.layerGroup()` called at class instantiation (before `ngAfterViewInit`). In a browser-only SPA this is harmless, but it triggers Leaflet import-time side-effects during DI construction. Defer until SSR or prerendering is considered.

## Deferred from: code review of 3-5-reorder-steps (2026-05-10)

- **Steps missing from `StepIds` retain stale SortOrder** [`StepService.cs`] — v1 intentional per Dev Notes ("missing/extra IDs are ignored or skip sort assignment"). Address with a strict full-list validation in a future hardening pass.
- **Response sorted from in-memory list, not re-queried DB state** [`StepService.cs`] — consequence of above; steps absent from request keep pre-save order in the response. Acceptable for v1; add a re-query in the hardening pass.
- **Race condition on concurrent reorder requests** [`StepService.cs`] — no row locking or EF optimistic concurrency. Out of scope for v1. Add serializable transaction or `RowVersion` concurrency token in a resilience pass.
- **No validation that all `StepIds` belong to the trip** [`StepService.cs`] — foreign IDs silently skipped (no IDOR risk since the query is already scoped to tripId). v1 intentional per Dev Notes. Enforce in a hardening pass.
- **`subscribe()` without `takeUntilDestroyed` on `reorderSteps`** [`step-list.component.ts`] — pre-existing pattern in all service calls. Address in an Angular lifecycle hygiene pass (also deferred in 3-4).
- **`onDrop` reads `this.steps()` signal rather than `event.container.data`** [`step-list.component.ts`] — index drift theoretical in single-user context. Monitor for CDK version changes that affect event data binding.
- **No backend tests for edge cases (partial StepIds, empty list, duplicate IDs)** [`StepServiceTests.cs`] — happy path and ownership covered; edge cases deferred for a backend test expansion pass.
- **Duplicate IDs in `StepIds` cause last-write-wins corruption on same step** [`StepService.cs`] — benign in normal use; add deduplication in the validator when the hardening pass adds `ReorderStepsRequestValidator`.

## Deferred from: code review of 3-4-delete-step (2026-05-10)

- **Confirm dialog has no focus trap or Escape key handling** [`step-list.component.html`] — UX polish; address in an accessibility pass.
- **In-flight `finalize` writes to destroyed component signals** [`step-list.component.ts`] — pre-existing pattern across all add/update/delete flows; no `takeUntilDestroyed` used anywhere. Address in an Angular lifecycle hygiene pass.
- **`DeleteStepAsync` two DB round-trips not in a transaction** [`StepService.cs`] — stale ownership check possible between the two awaits; same pattern as AddStepAsync/UpdateStepAsync. Address with serializable transactions in a resilience pass.
- **`cancelDelete` does not reset `isDeletingStep`** [`step-list.component.ts`] — `finalize` resets it when the in-flight request completes; no stuck state in practice. Revisit if UX feedback shows confusion.
- **`tripId` not null-guarded in `doDelete`** [`step-list.component.ts`] — `@Input()` is always set before render; defensive guard deferred to a general input-validation pass.
- **Concurrent DELETE → `DbUpdateConcurrencyException` → 500** [`StepService.cs`] — global exception handler concern; same as prior stories' SaveChangesAsync deferral.
- **`DeleteStepAsync_WhenTripNotOwned` doesn't test concurrent-deletion window** [`StepServiceTests.cs`] — two-query race; same structural limitation as all service test methods.

## Deferred from: code review of 3-3-edit-step-details (2026-05-10)

- **FluentValidation `.WithMessage` chaining after `.Must()`** [`UpdateStepRequestValidator.cs:19`] — same pattern as CreateStepRequestValidator reviewed in story 3.2; test coverage verifies correct behaviour. Audit if FluentValidation major version is upgraded.
- **Controller conflates trip-not-owned and step-not-found into same 404** [`StepsController.cs`] — intentional; consistent with all other step/trip endpoints. Consider returning 403 for trip-not-owned only if the API gains a public-facing consumer.
- **`StepType` default 0 silently accepted when `type` is absent from JSON body** [`UpdateStepRequest.cs`] — same pre-existing issue as CreateStepRequest (deferred in story 3-1). Fix by making `StepType?` nullable in the DTO.
- **`UpdatedAt` set on entity before `SaveChangesAsync`** [`StepService.cs`] — EF DbContext is scoped per-request so in-memory inconsistency doesn't leak across requests. Revisit if a retry pattern is added.
- **Validator error messages hardcode StepType enum values** [`UpdateStepRequestValidator.cs`] — same as CreateStepRequestValidator. Extract to a shared constant if enum values change.
- **Other-field validation errors collapsed to a single banner with no per-field inline feedback** [`step-list.component.html`] — pre-existing UX limitation from the add-step form. Address in a UX polish pass (Epic 5+).
- **`CreateStepRequest` and `UpdateStepRequest` TypeScript interfaces are structurally identical** [`step.service.ts`] — valid refactoring opportunity; merge into a single `StepPayload` type when a shared-types module is introduced.
- **`SaveChangesAsync` `DbUpdateException` propagates as an unhandled 500** [`StepService.cs`] — pre-existing across all services. Address with a global exception-handling middleware in an infrastructure pass.

## Deferred from: code review of 3-2-search-step-location-via-autocomplete (2026-05-10)

- **Empty location name from missing Place fields** — `place.formatted_address ?? place.name ?? ''` can yield an empty string for unusual place types where both fields are absent. Very unlikely when `fields: ['formatted_address', 'name', 'geometry']` are explicitly requested. Revisit if real-world reports emerge.
- **Directive selector allows non-input elements** — `[appPlacesAutocomplete]` can be applied to any element, but `google.maps.places.Autocomplete` requires an `HTMLInputElement`. Currently enforced by convention only. Add a type guard or restrict the selector (e.g., `input[appPlacesAutocomplete]`) in a future directive hardening pass.

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
