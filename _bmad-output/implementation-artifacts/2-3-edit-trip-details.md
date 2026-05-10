# Story 2.3: Edit Trip Details

Status: review

## Story

As an **authenticated user**,
I want to edit a trip's name, description, and dates,
So that my trip information stays accurate.

## Acceptance Criteria

1. **Given** an authenticated user viewing a trip
   **When** they submit the edit trip form
   **Then** the trip is updated with the new values
   **And** both start date and end date are optional
   **And** invalid input shows inline validation errors
   **And** the updated values are immediately reflected in the UI

## Tasks / Subtasks

- [x] Task 1: Backend — Add StartDate/EndDate to Trip entity + migration (AC: #1)
  - [ ] Add `DateTime? StartDate` and `DateTime? EndDate` to `rollplan-api/Models/Entities/Trip.cs`
  - [ ] Add `DateTime? StartDate` and `DateTime? EndDate` to `rollplan-api/Models/DTOs/Trips/TripResponse.cs`
  - [ ] Create migration file `rollplan-api/Migrations/20260509000002_AddTripDates.cs` (see Migration Details below)
  - [ ] Create designer file `rollplan-api/Migrations/20260509000002_AddTripDates.Designer.cs` (copy pattern from TripNameMaxLength.Designer.cs, update MigrationAttribute and BuildTargetModel)
  - [ ] Update `rollplan-api/Migrations/AppDbContextModelSnapshot.cs` Trip entity section to include StartDate and EndDate properties

- [x] Task 2: Backend — Create UpdateTripRequest DTO + validator (AC: #1)
  - [ ] Create `rollplan-api/Models/DTOs/Trips/UpdateTripRequest.cs` with: `string Name`, `string? Description`, `IFormFile? CoverImage`, `DateTime? StartDate`, `DateTime? EndDate`
  - [ ] Create `rollplan-api/Models/DTOs/Trips/UpdateTripRequestValidator.cs`: Name required + MaxLength(200), CoverImage content-type and size rules (same as CreateTripRequestValidator)

- [x] Task 3: Backend — Add GetTripAsync + UpdateTripAsync to ITripService + TripService (AC: #1)
  - [ ] Add `Task<TripResponse?> GetTripAsync(Guid userId, Guid tripId)` to `rollplan-api/Services/ITripService.cs`
  - [ ] Add `Task<TripResponse?> UpdateTripAsync(Guid userId, Guid tripId, UpdateTripRequest request)` to `rollplan-api/Services/ITripService.cs`
  - [ ] Implement `GetTripAsync` in `TripService`: `FirstOrDefaultAsync(t => t.Id == tripId && t.UserId == userId)`, return `null` if not found, else `MapToResponse(trip)`
  - [ ] Implement `UpdateTripAsync` in `TripService`: find trip (null if missing/wrong owner); if new CoverImage provided — upload new (UUID filename), save to DB, then delete old; update Name/Description/StartDate/EndDate/UpdatedAt; on DB failure delete newly uploaded image; return `MapToResponse(trip)`

- [x] Task 4: Backend — Update TripsController (AC: #1)
  - [ ] Replace placeholder `GetTrip` action: call `GetTripAsync(GetCurrentUserId(), id)`, return `Ok(trip)` or `NotFound()`
  - [ ] Add `[HttpPut("{id:guid}")]` `UpdateTrip([FromForm] UpdateTripRequest request, Guid id)` action: call `UpdateTripAsync(GetCurrentUserId(), id, request)`, return `Ok(trip)` or `NotFound()`

- [x] Task 5: Backend — Unit tests for GetTripAsync + UpdateTripAsync (AC: #1)
  - [ ] Add to `rollplan-api-tests/Services/TripServiceTests.cs`:
    - `GetTripAsync_ReturnsTrip_WhenOwned` — seed trip, verify correct TripResponse returned
    - `GetTripAsync_ReturnsNull_WhenOwnedByOtherUser` — seed trip for other user, verify null
    - `GetTripAsync_ReturnsNull_WhenNotFound` — no trip seeded, verify null
    - `UpdateTripAsync_UpdatesFieldsAndReturnsResponse` — seed trip, update name/description, verify response fields
    - `UpdateTripAsync_UpdatesTimestamp` — verify UpdatedAt is refreshed to >= before update
    - `UpdateTripAsync_ReturnsNull_WhenNotOwned` — other user's trip, verify null returned, DB unchanged

- [x] Task 6: Angular — Extend Trip interface + add UpdateTripRequest (AC: #1)
  - [ ] Add `startDate?: string` and `endDate?: string` to the `Trip` interface in `rollplan-client/src/app/trips/services/trip.service.ts`
  - [ ] Add `export interface UpdateTripRequest { name: string; description?: string; coverImage?: File; startDate?: string; endDate?: string; }` to same file

- [x] Task 7: Angular — Add getTrip() + updateTrip() + currentTrip signal to TripService (AC: #1)
  - [ ] Add `private readonly _currentTrip = signal<Trip | null>(null)` and `readonly currentTrip = this._currentTrip.asReadonly()` to `TripService`
  - [ ] Add `getTrip(id: string): Observable<Trip>` — `GET ${API_BASE_URL}/trips/${id}`, tap sets `_currentTrip`
  - [ ] Add `updateTrip(id: string, request: UpdateTripRequest): Observable<Trip>` — builds FormData (name, description?, coverImage?, startDate?, endDate?), `PUT ${API_BASE_URL}/trips/${id}`, tap updates `_currentTrip` AND updates the trip in `_trips` list via `update(list => list.map(t => t.id === id ? updated : t))`

- [x] Task 8: Angular — Implement TripDetailComponent (AC: #1)
  - [ ] Convert `TripDetailComponent` to use `templateUrl` (external HTML file) — create `trip-detail.component.html`
  - [ ] Add field DI in `trip-detail.component.ts`:
    - `private readonly route = inject(ActivatedRoute)` — import `ActivatedRoute` from `@angular/router`
    - `private readonly tripService = inject(TripService)`
    - `private readonly router = inject(Router)` — import `Router` from `@angular/router`
    - `readonly trip = this.tripService.currentTrip`
    - `isLoading = signal(true)`, `isEditing = signal(false)`, `isSubmitting = signal(false)`, `serverError = signal<string | null>(null)`, `fileError = signal<string | null>(null)`
    - `readonly form: FormGroup` — initialized via `inject(FormBuilder)` in field initializer or constructor
  - [ ] Implement `OnInit`: get `id` from `route.snapshot.paramMap.get('id')!`; call `tripService.getTrip(id).subscribe({ next: () => { this.initForm(); this.isLoading.set(false); }, error: () => this.isLoading.set(false) })`
  - [ ] `initForm()`: populate form with current trip signal values (name, description, startDate, endDate)
  - [ ] `onFileChange(event)`: same pattern as `TripFormComponent` — validate type (JPEG/PNG) and size (≤10MB)
  - [ ] `onSubmit()`: guard invalid/submitting/fileError; set `isSubmitting(true)`; call `updateTrip(id, {...})`; on success: `isEditing.set(false)`; on error: set server/field errors from FluentValidation shape; `finalize(() => isSubmitting.set(false))`
  - [ ] Template (`trip-detail.component.html`):
    - Loading spinner while `isLoading()`
    - When loaded and `!isEditing()`: show trip name, description, status badge, dates, cover image, "Edit" button → `isEditing.set(true)`
    - When `isEditing()`: reactive form with name (required), description (textarea), startDate (date input), endDate (date input), coverImage (file input, optional), Cancel button → `isEditing.set(false)`, Save button
    - Back link `routerLink="/trips"` always visible
    - Error display for serverError() and fileError()
  - [ ] Add `ReactiveFormsModule` to `imports` array in component decorator
  - [ ] Import `OnInit`, `signal` from `@angular/core`; `FormBuilder`, `FormGroup`, `ReactiveFormsModule`, `Validators` from `@angular/forms`; `finalize` from `rxjs/operators`

- [x] Task 9: Angular — Unit tests (AC: #1)
  - [ ] Update `rollplan-client/src/app/trips/services/trip.service.spec.ts`:
    - `getTrip should make GET request to /trips/:id` — `expectOne(${API_BASE_URL}/trips/${id})`, method GET
    - `getTrip should set currentTrip signal` — flush mock trip, verify `service.currentTrip()` equals mock
    - `updateTrip should make PUT request to /trips/:id with FormData` — verify method PUT, body instanceof FormData
    - `updateTrip should update currentTrip and trips list signals` — flush updated trip, verify both signals
  - [ ] Create `rollplan-client/src/app/trips/trip-detail/trip-detail.component.spec.ts`:
    - Use stub `TripService` with `vi.fn()` mocks + `currentTrip` signal (same pattern as `trip-list.component.spec.ts`)
    - `should create` — component instantiates
    - `should call getTrip on init with route id` — verify `getTripSpy` called with correct id
    - `should show loading initially then hide after response` — verify `isLoading` signal transitions
    - `should show edit form when isEditing is true` — set `isEditing.set(true)`, detectChanges, verify form rendered
    - `should show trip details when not editing` — pre-populate currentTrip signal, verify name shown in template

### Review Findings

- [ ] [Review][Patch] Angular `updateTrip()` drops cleared description — truthy guard `if (request.description)` skips appending an empty string, so users cannot clear an existing description [rollplan-client/src/app/trips/services/trip.service.ts]
- [ ] [Review][Patch] `UpdateTripRequestValidator` missing cross-field date rule — `endDate` before `startDate` is accepted without validation error [rollplan-api/Models/DTOs/Trips/UpdateTripRequestValidator.cs]
- [ ] [Review][Patch] `UpdateTripRequest.StartDate`/`EndDate` typed as `DateTime?` (stored as `timestamp with time zone`) instead of `DateOnly?` — type mismatch with HTML date input strings; inconsistent with `Step.Date` which correctly uses `DateOnly?` [rollplan-api/Models/DTOs/Trips/UpdateTripRequest.cs]
- [ ] [Review][Patch] `trip-detail.component.spec.ts` missing test: `onSubmit()` should call `updateTrip` (named spec test absent) [rollplan-client/src/app/trips/trip-detail/trip-detail.component.spec.ts]
- [x] [Review][Defer] MIME type validation trusts client-provided `Content-Type` header, not file magic bytes [rollplan-api/Models/DTOs/Trips/UpdateTripRequestValidator.cs] — deferred, pre-existing
- [x] [Review][Defer] `UpdateTripAsync` old cover image orphaned when `DeleteFileAsync` throws after successful DB save [rollplan-api/Services/TripService.cs] — deferred, pre-existing

## Dev Notes

### Project Structure

- Backend: `rollplan-api/Models/Entities/`, `rollplan-api/Models/DTOs/Trips/`, `rollplan-api/Services/`, `rollplan-api/Controllers/`, `rollplan-api/Migrations/`
- Frontend: `rollplan-client/src/app/trips/services/`, `rollplan-client/src/app/trips/trip-detail/`
- Tests: `rollplan-api-tests/Services/TripServiceTests.cs`, `rollplan-client/src/app/trips/trip-detail/trip-detail.component.spec.ts`

### What Already Exists (Do NOT Reinvent)

- `TripService` (C#) — has `MapToResponse()` private static helper; reuse for both GetTripAsync and UpdateTripAsync
- `ITripService` — exists with CreateTripAsync + GetTripsAsync; only extend
- `TripsController` — has `GetCurrentUserId()` helper; `GetTrip` is currently a placeholder (`return NotFound()`) — REPLACE it fully
- `CreateTripRequestValidator` — validator pattern to reuse for UpdateTripRequestValidator (same rules for Name and CoverImage)
- `TripDetailComponent` — exists as placeholder with inline template; convert to templateUrl + real implementation
- `TripFormComponent` — reference its `onFileChange()`, error handling, and form submission pattern (but do NOT break it)
- Route `/trips/:id → TripDetailComponent` — already wired in `app.routes.ts`; no routing changes needed
- `inject()` + field DI pattern — established in TripListComponent; use `inject(ActivatedRoute)`, `inject(TripService)`, `inject(Router)`, `inject(FormBuilder)`

### Migration Details

Since `dotnet ef` is not available locally, create these 3 files manually:

**`rollplan-api/Migrations/20260509000002_AddTripDates.cs`:**
```csharp
using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RollPlan.Api.Migrations
{
    public partial class AddTripDates : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "end_date",
                table: "trips",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "start_date",
                table: "trips",
                type: "timestamp with time zone",
                nullable: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(name: "end_date", table: "trips");
            migrationBuilder.DropColumn(name: "start_date", table: "trips");
        }
    }
}
```

**`rollplan-api/Migrations/20260509000002_AddTripDates.Designer.cs`:** Copy `20260509000001_TripNameMaxLength.Designer.cs` exactly, then:
- Change `[Migration("20260509000001")]` → `[Migration("20260509000002")]`
- Change `partial class TripNameMaxLength` → `partial class AddTripDates`
- In `BuildTargetModel`, inside the Trip entity block, add after the existing `UpdatedAt` property:
```csharp
b.Property<DateTime?>("EndDate")
    .HasColumnType("timestamp with time zone")
    .HasColumnName("end_date");

b.Property<DateTime?>("StartDate")
    .HasColumnType("timestamp with time zone")
    .HasColumnName("start_date");
```
- Update `.HasAnnotation("ProductVersion", "9.0.14")` — keep same version

**`rollplan-api/Migrations/AppDbContextModelSnapshot.cs`:** In the Trip entity block (around line 273), add after the `UpdatedAt` property declaration:
```csharp
b.Property<DateTime?>("EndDate")
    .HasColumnType("timestamp with time zone")
    .HasColumnName("end_date");

b.Property<DateTime?>("StartDate")
    .HasColumnType("timestamp with time zone")
    .HasColumnName("start_date");
```

### Technical Requirements

- **API endpoint GET:** `GET /api/v1/trips/{id}` — requires JWT, returns `200 Ok` with `TripResponse` or `404 NotFound`
- **API endpoint PUT:** `PUT /api/v1/trips/{id}` — requires JWT, `[FromForm]` multipart, returns `200 Ok` with updated `TripResponse` or `404 NotFound`
- **EF Core query:** `FirstOrDefaultAsync(t => t.Id == tripId && t.UserId == userId)` — ownership check enforced at DB query level
- **Image update flow:** Upload new image FIRST → save DB → delete old image. On DB failure → delete new image (never delete old before DB success)
- **Angular signal updates:** `_currentTrip.set(trip)` in getTrip tap; `_currentTrip.set(updated)` AND `_trips.update(list => list.map(...))` in updateTrip tap
- **Form pre-population:** `initForm()` reads from `this.trip()` signal (currentTrip), called after successful getTrip
- **Date handling:** `startDate`/`endDate` are `DateTime?` on backend (`timestamp with time zone`), sent as ISO strings from Angular `<input type="date">` (e.g. "2026-05-09T00:00:00.000Z"), optional in FormData
- **FormGroup initialization:** Use `inject(FormBuilder)` — declare as field: `private readonly fb = inject(FormBuilder)` then `readonly form = this.fb.group({...})` as field initializer, OR use constructor. Avoid TS2729.

### Architecture Compliance

- **Auth:** `[Authorize]` already on controller class — no change needed
- **Validation:** FluentValidation registered via `AddFluentValidationAutoValidation()` — create validator class, it auto-registers
- **Error shape from server:** `{ errors: { Name: ['...'] }, ... }` for field errors; `{ detail: '...' }` for generic — same handling as TripFormComponent
- **No raw SQL** — EF Core LINQ only
- **Return 404 for wrong owner** — never reveal other users' trips exist (return NotFound, not Forbidden)
- **inject() for component DI** — use field-level `inject()`, NOT constructor parameters (prevents TS2729 initializer ordering error)

### Testing Requirements

- **Backend:** InMemory EF Core — seed `Trip` via `_dbContext.Trips.Add() + SaveChangesAsync()` before calling service. `_storageMock` available from constructor.
- **Angular service tests:** Use `HttpTestingController` (existing pattern in `trip.service.spec.ts`) — `expectOne(`${API_BASE_URL}/trips/${id}`)` for getTrip, `expectOne(...)` method PUT for updateTrip
- **Angular component tests:** Stub `TripService` with `vi.fn()` (import `vi` from `'vitest'`) + signals (same pattern as `trip-list.component.spec.ts`). `currentTrip` stub signal pre-populated with mock trip. `getTrip` spy returns `of(mockTrip)`.
- **Import `vi` from `'vitest'`** — NOT Jasmine `spyOn`

### Previous Story Intelligence

- **Pattern — inject():** `private readonly x = inject(X)` for all component dependencies (avoids TS2729)
- **Pattern — signal loading:** `isLoading = signal(true)` → `false` in subscribe next + error
- **Pattern — finalize():** `pipe(finalize(() => isSubmitting.set(false)))` for submit state cleanup
- **Pattern — form DI:** TripFormComponent uses constructor DI for FormBuilder — but to be consistent with inject() pattern, use `private readonly fb = inject(FormBuilder)` in TripDetailComponent
- **Pattern — tap() for signals:** `tap(trip => this._currentTrip.set(trip))` in service
- **Pattern — FluentValidation errors:** `err.error?.errors` map by field name; `err.error?.detail` for generic — see TripFormComponent.onSubmit() for exact shape
- **Pattern — UUID filenames:** `$"{Guid.NewGuid()}{ext}"` for uploaded files (security — never use user-provided filename)
- **Pattern — image cleanup on failure:** try/catch around SaveChangesAsync, delete new upload in catch block
- **Pattern — stub service in Angular tests:** `{ provide: TripService, useValue: stubObject }` with `vi.fn()` methods and `signal()` fields — see trip-list.component.spec.ts
- **Lesson — ActivatedRoute in tests:** When using `inject(ActivatedRoute)`, provide `provideRouter([...])` in TestBed OR provide a stub ActivatedRoute: `{ provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 'test-id' } } } }`

### File Structure

**Backend files to modify:**
- `rollplan-api/Models/Entities/Trip.cs`
- `rollplan-api/Models/DTOs/Trips/TripResponse.cs`
- `rollplan-api/Services/ITripService.cs`
- `rollplan-api/Services/TripService.cs`
- `rollplan-api/Controllers/TripsController.cs`
- `rollplan-api-tests/Services/TripServiceTests.cs`
- `rollplan-api/Migrations/AppDbContextModelSnapshot.cs`

**Backend files to create:**
- `rollplan-api/Models/DTOs/Trips/UpdateTripRequest.cs`
- `rollplan-api/Models/DTOs/Trips/UpdateTripRequestValidator.cs`
- `rollplan-api/Migrations/20260509000002_AddTripDates.cs`
- `rollplan-api/Migrations/20260509000002_AddTripDates.Designer.cs`

**Frontend files to modify:**
- `rollplan-client/src/app/trips/services/trip.service.ts`
- `rollplan-client/src/app/trips/services/trip.service.spec.ts`
- `rollplan-client/src/app/trips/trip-detail/trip-detail.component.ts`

**Frontend files to create:**
- `rollplan-client/src/app/trips/trip-detail/trip-detail.component.html`
- `rollplan-client/src/app/trips/trip-detail/trip-detail.component.spec.ts`

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List

### Change Log
