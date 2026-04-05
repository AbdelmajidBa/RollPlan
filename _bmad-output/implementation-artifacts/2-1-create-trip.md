# Story 2.1: Create Trip

Status: ready-for-dev

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

- [ ] Task 1: Backend — Create Trip entity + DTOs + Validator (AC: #1)
  - [ ] Create `rollplan-api/Models/Entities/Trip.cs` — `{ Guid Id, string Name, string? Description, TripStatus Status, string? CoverImageUrl, DateTime CreatedAt, DateTime UpdatedAt, Guid UserId }`
  - [ ] Add `DbSet<Trip> Trips` to `AppDbContext.cs`
  - [ ] Create `rollplan-api/Models/DTOs/Trips/CreateTripRequest.cs` — `{ string Name, string? Description, IFormFile? CoverImage }`
  - [ ] Create `rollplan-api/Models/DTOs/Trips/CreateTripRequestValidator.cs`:
    - `Name`: `NotEmpty()` with message `"Trip name is required."`
    - `Description`: optional, no validation
    - `CoverImage`: optional, but if provided: file type JPG/PNG, max 10MB
  - [ ] Create `rollplan-api/Models/DTOs/Trips/TripResponse.cs` — `{ Guid Id, string Name, string? Description, TripStatus Status, string? CoverImageUrl, DateTime CreatedAt, DateTime UpdatedAt }`

- [ ] Task 2: Backend — Create ITripService + TripService (AC: #1)
  - [ ] Create `rollplan-api/Services/ITripService.cs` with method:
    ```csharp
    Task<TripResponse> CreateTripAsync(Guid userId, CreateTripRequest request);
    ```
  - [ ] Implement `rollplan-api/Services/TripService.cs`:
    - Constructor: inject `AppDbContext dbContext, IStorageService storageService`
    - `CreateTripAsync`: create Trip entity, handle cover image upload if provided, save to DB, return TripResponse

- [ ] Task 3: Backend — Create TripsController (AC: #1)
  - [ ] Create `rollplan-api/Controllers/TripsController.cs`:
    - `[ApiController]`, `[Route("api/v1/trips")]`, `[Authorize]`
    - Constructor: inject `ITripService`
    - Helper: `GetCurrentUserId()` (reuse from UsersController)
    - `[HttpPost]` `CreateTrip([FromForm] CreateTripRequest request)` → calls `CreateTripAsync` → returns `CreatedAtAction` with location to trip detail
  - [ ] Register `ITripService` in `rollplan-api/Program.cs`:
    ```csharp
    builder.Services.AddScoped<ITripService, TripService>();
    ```

- [ ] Task 4: Backend unit tests (AC: #1)
  - [ ] Create `rollplan-api-tests/Services/TripServiceTests.cs`:
    - `CreateTripAsync_ValidRequest_CreatesTripAndReturnsResponse`
    - `CreateTripAsync_WithCoverImage_UploadsImageAndSetsUrl`
    - `CreateTripAsync_InvalidImageType_ThrowsValidationException`
    - `CreateTripAsync_ImageTooLarge_ThrowsValidationException`
  - [ ] Run: `dotnet test rollplan-api-tests/ --configuration Release` — ensure all pass

- [ ] Task 5: Angular — Add trip methods to TripService (AC: #1)
  - [ ] Create `rollplan-client/src/app/trips/services/trip.service.ts` (if not exists)
  - [ ] Add `Trip` interface: `{ id: string; name: string; description?: string; status: TripStatus; coverImageUrl?: string; createdAt: string; updatedAt: string }`
  - [ ] Add `CreateTripRequest` interface: `{ name: string; description?: string; coverImage?: File }`
  - [ ] Add `createTrip(request: CreateTripRequest): Observable<Trip>` — `POST ${API_BASE_URL}/trips` with FormData

- [ ] Task 6: Angular — Create TripFormComponent (AC: #1)
  - [ ] Create `rollplan-client/src/app/trips/trip-form/trip-form.component.ts`
  - [ ] Create `rollplan-client/src/app/trips/trip-form/trip-form.component.html`
  - [ ] Implement Reactive Form with name (required), description (optional), coverImage (optional)
  - [ ] Handle file upload validation (JPG/PNG, 10MB max)
  - [ ] On submit: call `createTrip()`, navigate to `/trips/${trip.id}` on success

- [ ] Task 7: Angular — Create TripListComponent with "Create Trip" button (AC: #1)
  - [ ] Create `rollplan-client/src/app/trips/trip-list/trip-list.component.ts`
  - [ ] Create `rollplan-client/src/app/trips/trip-list/trip-list.component.html`
  - [ ] Add "Create New Trip" button that opens TripFormComponent (modal or route)

- [ ] Task 8: Angular — Update routing for trips (AC: #1)
  - [ ] Edit `rollplan-client/src/app/app.routes.ts` — add `/trips` route with TripListComponent, `/trips/create` route with TripFormComponent, `/trips/:id` route (placeholder for now)
  - [ ] Ensure all trip routes are protected by authGuard

- [ ] Task 9: Angular unit tests (AC: #1)
  - [ ] Create `rollplan-client/src/app/trips/services/trip.service.spec.ts` — test createTrip method
  - [ ] Create `rollplan-client/src/app/trips/trip-form/trip-form.component.spec.ts` — test form validation and submission
  - [ ] Create `rollplan-client/src/app/trips/trip-list/trip-list.component.spec.ts` — test create button
  - [ ] Run: `ng test --watch=false` — ensure all pass

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

Grok Code Fast 1

### Debug Log References

### Completion Notes List

### File List</content>
<parameter name="filePath">d:\Projects\RollPlan\_bmad-output\implementation-artifacts\2-1-create-trip.md