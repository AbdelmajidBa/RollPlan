# Story 2.2: View Trip List

Status: review

## Story

As an **authenticated user**,
I want to see a list of all my trips,
So that I can quickly access and manage each one.

## Acceptance Criteria

1. **Given** an authenticated user on the trips page
   **When** the page loads
   **Then** all trips owned by the user are displayed with name, status, and cover image (if set)
   **And** trips are ordered by most recently updated
   **And** an empty state is shown when no trips exist
   **And** each trip card links to the trip detail page

## Tasks / Subtasks

- [x] Task 1: Backend — Add `GetTripsAsync` to `ITripService` + `TripService` (AC: #1)
  - [x] Add `Task<IEnumerable<TripResponse>> GetTripsAsync(Guid userId)` to `rollplan-api/Services/ITripService.cs`
  - [x] Implement in `rollplan-api/Services/TripService.cs`: query `_dbContext.Trips` where `UserId == userId`, order by `UpdatedAt DESC`, project to `TripResponse` via `MapToResponse`

- [x] Task 2: Backend — Add `GET /api/v1/trips` endpoint (AC: #1)
  - [x] Add `[HttpGet]` `GetTrips()` action to `rollplan-api/Controllers/TripsController.cs`
  - [x] Call `GetTripsAsync(GetCurrentUserId())` and return `Ok(trips)`

- [x] Task 3: Backend — Unit tests for `GetTripsAsync` (AC: #1)
  - [x] Add to `rollplan-api-tests/Services/TripServiceTests.cs`:
    - `GetTripsAsync_ReturnsOnlyUserTrips` — seeds trips for two users, verifies only caller's trips returned
    - `GetTripsAsync_OrdersByUpdatedAtDescending` — seeds 3 trips with different UpdatedAt values, verifies order
    - `GetTripsAsync_NoTrips_ReturnsEmpty` — no trips seeded, verifies empty collection returned

- [x] Task 4: Angular — Add `getTrips()` to `TripService` (AC: #1)
  - [x] Add `getTrips(): Observable<Trip[]>` to `rollplan-client/src/app/trips/services/trip.service.ts`
  - [x] `GET ${API_BASE_URL}/trips` returning `Trip[]`, use `tap(trips => this._trips.set(trips))` to populate signal
  - [x] No changes to existing `createTrip()` — it already pushes new trip to front of `_trips` signal via `tap(trip => this._trips.update(list => [trip, ...list]))`

- [x] Task 5: Angular — Update `TripListComponent` to load trips on init and link cards (AC: #1)
  - [x] Implement `OnInit` in `rollplan-client/src/app/trips/trip-list/trip-list.component.ts`:
    - Call `this.tripService.getTrips().subscribe()` in `ngOnInit()`
    - Add `isLoading` signal (`signal(true)`) — set to `false` on success or error in subscribe
  - [x] Update `rollplan-client/src/app/trips/trip-list/trip-list.component.html`:
    - Wrap each trip card `<div>` in `<a [routerLink]="['/trips', trip.id]">` (or convert div to anchor) so each card navigates to `/trips/:id`
    - Add loading state: show spinner or skeleton while `isLoading()` is true
  - [x] Import `OnInit` from `@angular/core`

- [x] Task 6: Angular — Update unit tests (AC: #1)
  - [x] Update `rollplan-client/src/app/trips/services/trip.service.spec.ts`:
    - `getTrips_makesGetRequest` — verify GET `/api/v1/trips` called
    - `getTrips_populatesSignal` — verify `_trips` signal is set with response data
  - [x] Update `rollplan-client/src/app/trips/trip-list/trip-list.component.spec.ts`:
    - Add `ngOnInit` test — verify `getTrips()` is called on component creation (spy on service)
    - Add trip card link test — create fixture with mock trips, verify cards have `routerLink` pointing to `/trips/:id`
    - Add loading state test — verify loading is shown initially then hidden after HTTP response

## Dev Notes

### Project Structure Notes

- Backend: `rollplan-api/Services/`, `rollplan-api/Controllers/`, tests in `rollplan-api-tests/Services/`
- Frontend: `rollplan-client/src/app/trips/services/`, `rollplan-client/src/app/trips/trip-list/`
- Do NOT create new files beyond what's listed — extend existing files only

### What Already Exists (Do NOT Reinvent)

- `TripListComponent` (`trip-list.component.ts` + `.html`) — exists with full UI already. Only add `OnInit` call and update card to be a link
- `TripService` (`trip.service.ts`) — exists with `_trips` signal and `createTrip()`. Only add `getTrips()`
- `TripResponse` DTO — already has all fields needed (`Id`, `Name`, `Description`, `Status`, `CoverImageUrl`, `UpdatedAt`)
- `TripsController` — exists with `GetCurrentUserId()` helper and `CreateTrip()`. Only add `GetTrips()` action
- `TripService` (C#) — exists with `MapToResponse()` private helper. Reuse it
- `ITripService` — exists. Only add new method signature
- Routing `/trips/:id` → `TripDetailComponent` already wired (it's a placeholder returning "coming soon")

### Template Update Detail

Current card is a `<div>` with no link. Add `[routerLink]="['/trips', trip.id]"` and cursor pointer so entire card is clickable. The `<a>` tag approach is preferred for semantic HTML (keyboard navigable, NFR13):

```html
<a [routerLink]="['/trips', trip.id]"
   class="block rounded-[1.5rem] bg-slate-900/90 p-6 ring-1 ring-white/10 shadow-lg transition hover:ring-sky-500/40 cursor-pointer">
  <!-- existing card content -->
</a>
```

### References

- **Architecture:** `_bmad-output/planning-artifacts/architecture.md#API & Communication Patterns` — RESTful GET endpoint, JWT auth required, Angular Signals for state
- **Architecture:** `_bmad-output/planning-artifacts/architecture.md#Frontend Architecture` — `inject()` for DI, `signal()` for state, `tap()` for side-effects
- **Previous Story (2.1):** `_bmad-output/implementation-artifacts/2-1-create-trip.md` — established patterns: `inject()` for field DI, `tap()` to update signal, `provideHttpClient()` + `provideHttpClientTesting()` in tests, `GetCurrentUserId()` in controller, InMemory EF Core for unit tests
- **UX:** `_bmad-output/planning-artifacts/ux-design-specification.md#UX Consistency Patterns` — loading states, empty states, card hover effects

### Technical Requirements

- **API endpoint:** `GET /api/v1/trips` — requires JWT, returns `200 Ok` with `IEnumerable<TripResponse>` ordered by `updated_at DESC`
- **EF Core query:** `_dbContext.Trips.Where(t => t.UserId == userId).OrderByDescending(t => t.UpdatedAt)` then project to `TripResponse`
- **Angular signal update:** `tap(trips => this._trips.set(trips))` — replaces the whole list (full refresh on load)
- **Loading state:** `isLoading = signal(true)`; set to `false` in both success and error paths of subscribe
- **No pagination required** in this story — return all trips for the user

### Architecture Compliance

- **Database:** EF Core LINQ — no raw SQL, use `.Where()` + `.OrderByDescending()` + `.Select()` (or project after ToListAsync)
- **API:** Return `Ok(trips)` — 200 status, same `TripResponse` DTO from Story 2.1
- **Auth:** `[Authorize]` already on controller class — no change needed
- **Frontend:** Angular Signals for state; `getTrips()` returns `Observable<Trip[]>`, component subscribes in `ngOnInit`
- **Error Handling:** Subscribe error callback sets `isLoading(false)` — API errors handled by global error interceptor

### Library & Framework Requirements

- **No new dependencies** — all packages already installed
- EF Core async: `await _dbContext.Trips.Where(...).OrderByDescending(...).Select(...).ToListAsync()`
- Angular: `OnInit` from `@angular/core` (already imported in other components)

### File Structure Requirements

**Backend files to modify:**
- `rollplan-api/Services/ITripService.cs` — add `GetTripsAsync` signature
- `rollplan-api/Services/TripService.cs` — implement `GetTripsAsync`
- `rollplan-api/Controllers/TripsController.cs` — add `GetTrips` action
- `rollplan-api-tests/Services/TripServiceTests.cs` — add 3 new tests

**Frontend files to modify:**
- `rollplan-client/src/app/trips/services/trip.service.ts` — add `getTrips()`
- `rollplan-client/src/app/trips/services/trip.service.spec.ts` — add getTrips tests
- `rollplan-client/src/app/trips/trip-list/trip-list.component.ts` — add `OnInit`, `isLoading` signal, `ngOnInit`
- `rollplan-client/src/app/trips/trip-list/trip-list.component.html` — convert card div to anchor, add loading state
- `rollplan-client/src/app/trips/trip-list/trip-list.component.spec.ts` — extend with new tests

**No new files required.**

### Testing Requirements

- **Backend unit tests:** Use InMemory EF Core (already added to test project in Story 2.1). Seed `Trip` entities directly via `_dbContext.Trips.Add()` + `SaveChangesAsync()` before calling service. Use `_storageMock` from existing test class.
- **Angular service tests:** Use `HttpTestingController` — `expectOne('http://localhost:5000/api/v1/trips')` with method `GET`
- **Angular component tests:** Spy on `TripService.getTrips()` returning `of([])` or mock trips. Use `TestBed.inject(TripService)` to get instance. Verify `ngOnInit` calls getTrips.
- **Test the trip card link:** After fixture detectChanges with mock trips in signal, query `a[routerLink]` elements and assert href or routerLink value contains trip id.

### Previous Story Intelligence

- **Pattern — inject():** `private readonly tripService = inject(TripService)` — use field DI, NOT constructor DI (avoids TS2729)
- **Pattern — signal loading:** `isLoading = signal(true)` declared as field; set `false` in subscribe finalize or error handler
- **Pattern — tap() for signal updates:** `tap(result => this._signal.set(result))` in Observable pipeline
- **Pattern — InMemory test setup:** `new DbContextOptionsBuilder<AppDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options` — already in `TripServiceTests` constructor; seed data before each test
- **Pattern — controller helper:** `GetCurrentUserId()` already exists in `TripsController` — call it directly
- **Lesson:** `MapToResponse()` is a private static method in `TripService` — reuse for projecting each Trip entity

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List

### Change Log
