# Story 2.1: Create Trip

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an **authenticated user**,
I want to create a new trip with a name, description, and optional cover image,
So that I can start planning my itinerary.

## Acceptance Criteria

1. **Given** an authenticated user on the trips page
   **When** they submit the create trip form with a name and description
   **Then** a new trip is created and they are navigated to the trip detail page
   **And** an optional cover image can be uploaded (JPG/PNG, max 10MB)
   **And** the trip is assigned a default status of "Planning"
   **And** missing required fields show inline validation errors

## Tasks / Subtasks

- [x] Task 1: Backend — Create Trip entity + DTOs + Validator (AC: #1)
  - [x] Create `rollplan-api/Models/Entities/Trip.cs` — `{ Guid Id, string Name, string? Description, TripStatus Status, string? CoverImageUrl, DateTime CreatedAt, DateTime UpdatedAt, Guid UserId }`
  - [x] Add `DbSet<Trip> Trips` to `AppDbContext.cs`
  - [x] Create `rollplan-api/Models/DTOs/Trips/CreateTripRequest.cs` — `{ string Name, string? Description, IFormFile? CoverImage }`
  - [x] Create `rollplan-api/Models/DTOs/Trips/CreateTripRequestValidator.cs`:
    - `Name`: `NotEmpty()` with message `"Trip name is required."`
    - `Description`: optional, no validation
    - `CoverImage`: optional, but if provided: file type JPG/PNG, max 10MB
  - [x] Create `rollplan-api/Models/DTOs/Trips/TripResponse.cs` — `{ Guid Id, string Name, string? Description, TripStatus Status, string? CoverImageUrl, DateTime CreatedAt, DateTime UpdatedAt }`

- [x] Task 2: Backend — Create ITripService + TripService (AC: #1)
  - [x] Create `rollplan-api/Services/ITripService.cs` with method:
    ```csharp
    Task<TripResponse> CreateTripAsync(Guid userId, CreateTripRequest request);
    ```
  - [x] Implement `rollplan-api/Services/TripService.cs`:
    - Constructor: inject `AppDbContext dbContext, IStorageService storageService`
    - `CreateTripAsync`: create Trip entity, handle cover image upload if provided, save to DB, return TripResponse

- [x] Task 3: Backend — Create TripsController (AC: #1)
  - [x] Create `rollplan-api/Controllers/TripsController.cs`:
    - `[ApiController]`, `[Route("api/v1/trips")]`, `[Authorize]`
    - Constructor: inject `ITripService`
    - Helper: `GetCurrentUserId()` (reuse from UsersController)
    - `[HttpPost]` `CreateTrip([FromForm] CreateTripRequest request)` → calls `CreateTripAsync` → returns `CreatedAtAction` with location to trip detail
  - [x] Register `ITripService` in `rollplan-api/Program.cs`:
    ```csharp
    builder.Services.AddScoped<ITripService, TripService>();
    ```

- [x] Task 4: Backend unit tests (AC: #1)
  - [x] Create `rollplan-api-tests/Services/TripServiceTests.cs`:
    - `CreateTripAsync_ValidRequest_CreatesTripAndReturnsResponse`
    - `CreateTripAsync_WithCoverImage_UploadsImageAndSetsUrl`
    - `CreateTripAsync_NoCoverImage_DoesNotCallStorageService`
    - `CreateTripAsync_DefaultStatus_IsPlanningAndTimestampsSet`
  - [x] Added `Microsoft.EntityFrameworkCore.InMemory` to test project for EF Core in-memory testing

- [x] Task 5: Angular — Add trip methods to TripService (AC: #1)
  - [x] Create `rollplan-client/src/app/trips/services/trip.service.ts` (if not exists)
  - [x] Add `Trip` interface: `{ id: string; name: string; description?: string; status: TripStatus; coverImageUrl?: string; createdAt: string; updatedAt: string }`
  - [x] Add `CreateTripRequest` interface: `{ name: string; description?: string; coverImage?: File }`
  - [x] Add `createTrip(request: CreateTripRequest): Observable<Trip>` — `POST ${API_BASE_URL}/trips` with FormData

- [x] Task 6: Angular — Create TripFormComponent (AC: #1)
  - [x] Create `rollplan-client/src/app/trips/trip-form/trip-form.component.ts`
  - [x] Create `rollplan-client/src/app/trips/trip-form/trip-form.component.html`
  - [x] Implement Reactive Form with name (required), description (optional), coverImage (optional)
  - [x] Handle file upload validation (JPG/PNG, 10MB max)
  - [x] On submit: call `createTrip()`, navigate to `/trips/${trip.id}` on success

- [x] Task 7: Angular — Create TripListComponent with "Create Trip" button (AC: #1)
  - [x] Create `rollplan-client/src/app/trips/trip-list/trip-list.component.ts`
  - [x] Create `rollplan-client/src/app/trips/trip-list/trip-list.component.html`
  - [x] Add "Create New Trip" button that opens TripFormComponent (route navigation)

- [x] Task 8: Angular — Update routing for trips (AC: #1)
  - [x] Edit `rollplan-client/src/app/app.routes.ts` — add `/trips` route with TripListComponent, `/trips/create` route with TripFormComponent, `/trips/:id` route with TripDetailComponent (placeholder)
  - [x] Ensure all trip routes are protected by authGuard

- [x] Task 9: Angular unit tests (AC: #1)
  - [x] Create `rollplan-client/src/app/trips/services/trip.service.spec.ts` — test createTrip method
  - [x] Create `rollplan-client/src/app/trips/trip-form/trip-form.component.spec.ts` — test form validation and submission
  - [x] Create `rollplan-client/src/app/trips/trip-list/trip-list.component.spec.ts` — test create button

### Senior Developer Review (AI)

**Review Date:** 2026-05-09
**Outcome:** Approved (all patches applied)
**Action Items:** 8 patch ✅, 7 defer, 2 dismissed

#### Action Items

- [x] [Review][Patch][High] Orphaned blob when DB save fails after image upload [rollplan-api/Services/TripService.cs]
- [x] [Review][Patch][Med] TripStatus enum serializes as integer in API response — needs JsonStringEnumConverter [rollplan-api/Program.cs]
- [x] [Review][Patch][Med] FluentValidation field errors not shown inline — client reads `err.error?.detail` but FluentValidation emits `err.error?.errors` map [rollplan-client/src/app/trips/trip-form/trip-form.component.ts]
- [x] [Review][Patch][Med] Name field has no max-length in validator or DB column — unbounded text [rollplan-api/Models/DTOs/Trips/CreateTripRequestValidator.cs]
- [x] [Review][Patch][Med] File extension from client-supplied filename passed unsanitised to IStorageService — path-traversal risk [rollplan-api/Services/TripService.cs]
- [x] [Review][Patch][Med] onSubmit proceeds when fileError is already visible — contradictory UI feedback [rollplan-client/src/app/trips/trip-form/trip-form.component.ts]
- [x] [Review][Patch][Low] MemoryStream in CreateFormFileMock test helper never disposed [rollplan-api-tests/Services/TripServiceTests.cs]
- [x] [Review][Patch][Low] Whitespace-only description stored as-is — `"   "` passes `description || undefined` check [rollplan-client/src/app/trips/trip-form/trip-form.component.ts]
- [x] [Review][Defer] GetCurrentUserId throws UnauthorizedAccessException — pre-existing pattern copied from UsersController, not introduced by this story
- [x] [Review][Defer] MIME-type spoofing: magic bytes not verified — security hardening deferred to separate story
- [x] [Review][Defer] GetTrip placeholder returns 404 (Location header broken) — intentional stub, will be implemented in Story 2.3
- [x] [Review][Defer] TripListComponent shows empty list on fresh page load — listing trips is scope of Story 2.2
- [x] [Review][Defer] TripDetailComponent is a placeholder — explicitly scoped to Epic 3
- [x] [Review][Defer] No CancellationToken propagated — pre-existing pattern across all controllers/services
- [x] [Review][Defer] Timestamp equality assertion coupled to implementation detail — low risk test design note

### Review Follow-ups (AI)

- [x] [AI-Review][High] Fix orphaned blob: delete uploaded image if SaveChangesAsync throws
- [x] [AI-Review][Med] Fix TripStatus JSON serialization: added global JsonStringEnumConverter in Program.cs
- [x] [AI-Review][Med] Fix server validation error display: parse `err.error?.errors` for inline field errors
- [x] [AI-Review][Med] Add Name max-length: MaximumLength(200) in validator + HasMaxLength(200) in EF config + migration
- [x] [AI-Review][Med] Sanitise file extension in TripService: derive .jpg/.png from validated ContentType, not raw filename
- [x] [AI-Review][Med] Block form submit when fileError is active
- [x] [AI-Review][Low] Dispose MemoryStream in CreateFormFileMock: switched to factory delegate Returns(() => new MemoryStream(...))
- [x] [AI-Review][Low] Trim/validate description: description?.trim() || undefined

## Dev Notes

### Project Structure Notes

- Follow feature-folder structure: `trips/` folder with `services/`, `trip-list/`, `trip-form/`, `trip-detail/` subfolders
- Backend: Controllers in root Controllers/, Services in root Services/, Models/Entities and Models/DTOs organized by feature
- Align with unified project structure from architecture.md — no deviations

### References

- **Architecture:** [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture] — Trip entity schema, EF Core Code-First, Guid PKs, snake_case columns
- **Architecture:** [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns] — RESTful endpoints, `/api/v1/trips`, ProblemDetails errors
- **Architecture:** [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture] — Feature-folder structure, Angular Signals, Reactive Forms
- **Architecture:** [Source: _bmad-output/planning-artifacts/architecture.md#Infrastructure & Deployment] — IStorageService abstraction for photo storage
- **UX Design:** [Source: _bmad-output/planning-artifacts/ux-design-specification.md#2.3 Success Criteria] — Trip creation in under 30 seconds, immediate visual feedback
- **Previous Story Patterns:** [Source: _bmad-output/implementation-artifacts/1-5-user-profile-view-and-edit.md] — DTO + Validator pattern, Service layer, Controller with [Authorize], GetCurrentUserId() helper, Angular Reactive Forms, authGuard protection

### Technical Requirements

- **Trip Entity:** Guid Id, string Name, string? Description, TripStatus Status (enum: Planning, Active, Completed, Archived), string? CoverImageUrl, DateTime CreatedAt/UpdatedAt, Guid UserId
- **TripStatus enum:** Define in Models/Entities/TripStatus.cs
- **File Upload:** Use IFormFile in CreateTripRequest, validate server-side (type + size), store via IStorageService
- **Default Status:** Always set Status = TripStatus.Planning on creation
- **Navigation:** After creation, redirect to `/trips/${trip.id}` (trip detail page - will be implemented in future story)
- **Validation:** Client-side Reactive Forms + server-side FluentValidation, show inline errors
- **Authentication:** All trip endpoints require JWT, use [Authorize] on controller

### Architecture Compliance

- **Database:** PostgreSQL with EF Core, snake_case columns via UseSnakeCaseNamingConvention()
- **API:** RESTful, resource-based, `/api/v1/trips` POST endpoint, returns 201 Created with Location header
- **Error Handling:** ProblemDetails for all errors, caught by ErrorHandlingMiddleware
- **Storage:** IStorageService abstraction (LocalStorageService for dev, AzureBlobStorageService for prod)
- **Frontend:** Angular Signals for state, HttpClient with auth interceptor, Reactive Forms for validation
- **Testing:** Unit tests for services, integration tests for controllers, Angular component tests

### Library Framework Requirements

- **Backend:** EF Core 8, FluentValidation, ASP.NET Core Identity, Azure.Storage.Blobs
- **Frontend:** Angular 17+, RxJS, Angular Reactive Forms, Tailwind CSS
- **No new dependencies** — all required packages already installed per Epic 1

### File Structure Requirements

- **Backend Files to Create/Modify:**
  - `Models/Entities/Trip.cs`
  - `Models/Entities/TripStatus.cs`
  - `Models/DTOs/Trips/CreateTripRequest.cs`
  - `Models/DTOs/Trips/CreateTripRequestValidator.cs`
  - `Models/DTOs/Trips/TripResponse.cs`
  - `Services/ITripService.cs`
  - `Services/TripService.cs`
  - `Controllers/TripsController.cs`
  - `Data/AppDbContext.cs` (add DbSet)
  - `Program.cs` (register service)
  - Tests in `rollplan-api-tests/`

- **Frontend Files to Create/Modify:**
  - `trips/services/trip.service.ts`
  - `trips/trip-list/trip-list.component.ts` + `.html`
  - `trips/trip-form/trip-form.component.ts` + `.html`
  - `app.routes.ts` (add trip routes)
  - Tests in respective `.spec.ts` files

### Testing Requirements

- **Backend:** Unit tests for TripService (happy path, validation failures, storage errors)
- **Frontend:** Unit tests for TripService, component tests for form validation and submission
- **Integration:** Controller tests for API endpoints, auth requirements
- **Coverage:** Aim for 80%+ coverage on new code

### Previous Story Intelligence

- **From 1-5:** Reuse GetCurrentUserId() pattern in controller, DTO + Validator pattern, Service interface + implementation, [Authorize] on controller, ProblemDetails error handling
- **Learnings:** Always validate server-side even with client validation, use tap() in Angular services to update signals, handle file uploads with [FromForm], test both success and error paths
- **Problems Avoided:** Don't forget to register services in Program.cs, ensure auth interceptor is in place, use proper HTTP status codes (201 for creation)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- Implemented full Trip creation flow: entity + EF Core migration, DTOs, FluentValidation, service layer, REST controller, Angular service, reactive form UI, routing
- TripStatus stored as string in PostgreSQL via `.HasConversion<string>()` for human-readable DB values
- EF Core migration created manually (no dotnet CLI available): `20260509000000_AddTripsTable` with trips table, snake_case columns, FK to asp_net_users
- Added `Microsoft.EntityFrameworkCore.InMemory` to test project for isolated EF Core unit testing
- Backend validator image tests use FluentValidation's When() conditional rules — invalid file type and size caught server-side
- Angular file validation done client-side in `onFileChange()` with 10MB and MIME type checks before any upload attempt
- `/trips/:id` route added as placeholder using `TripDetailComponent` — returns "coming soon" message, will be replaced in Epic 3

### File List

- `rollplan-api/Models/Entities/TripStatus.cs` (new)
- `rollplan-api/Models/Entities/Trip.cs` (new)
- `rollplan-api/Models/DTOs/Trips/CreateTripRequest.cs` (new)
- `rollplan-api/Models/DTOs/Trips/CreateTripRequestValidator.cs` (new)
- `rollplan-api/Models/DTOs/Trips/TripResponse.cs` (new)
- `rollplan-api/Services/ITripService.cs` (new)
- `rollplan-api/Services/TripService.cs` (new)
- `rollplan-api/Controllers/TripsController.cs` (new)
- `rollplan-api/Data/AppDbContext.cs` (modified — added DbSet<Trip>, Trip entity config)
- `rollplan-api/Program.cs` (modified — registered ITripService)
- `rollplan-api/Migrations/20260509000000_AddTripsTable.cs` (new)
- `rollplan-api/Migrations/20260509000000_AddTripsTable.Designer.cs` (new)
- `rollplan-api/Migrations/AppDbContextModelSnapshot.cs` (modified — added Trip model)
- `rollplan-api-tests/RollPlan.Api.Tests.csproj` (modified — added InMemory package)
- `rollplan-api-tests/Services/TripServiceTests.cs` (new)
- `rollplan-client/src/app/trips/services/trip.service.ts` (new)
- `rollplan-client/src/app/trips/services/trip.service.spec.ts` (new)
- `rollplan-client/src/app/trips/trip-form/trip-form.component.ts` (new)
- `rollplan-client/src/app/trips/trip-form/trip-form.component.html` (new)
- `rollplan-client/src/app/trips/trip-form/trip-form.component.spec.ts` (new)
- `rollplan-client/src/app/trips/trip-list/trip-list.component.ts` (new)
- `rollplan-client/src/app/trips/trip-list/trip-list.component.html` (new)
- `rollplan-client/src/app/trips/trip-list/trip-list.component.spec.ts` (new)
- `rollplan-client/src/app/trips/trip-detail/trip-detail.component.ts` (new — placeholder)
- `rollplan-client/src/app/app.routes.ts` (modified — replaced placeholder with real trip routes)

## Change Log

- 2026-05-09: Implemented Story 2.1 — Create Trip. Added backend Trip entity, EF Core migration, DTOs, FluentValidation, TripService, TripsController; added Angular TripService, TripFormComponent, TripListComponent, TripDetailComponent (placeholder), updated routing. All unit tests written for backend and frontend.