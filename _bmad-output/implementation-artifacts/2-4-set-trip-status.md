# Story 2.4: Set Trip Status

Status: review

## Story

As an **authenticated user**,
I want to set my trip's status (Planning, Active, Completed, Archived),
So that I can track where the trip is in its lifecycle.

## Acceptance Criteria

1. **Given** an authenticated user viewing a trip
   **When** they change the trip status
   **Then** the status is updated and reflected immediately in the UI
   **And** all four statuses are available: Planning, Active, Completed, Archived
   **And** the current status is visually indicated on the trip card and detail page

## Tasks / Subtasks

- [x] Task 1: Backend — SetTripStatusRequest DTO + SetTripStatusAsync (AC: #1)
  - [x] Create `rollplan-api/Models/DTOs/Trips/SetTripStatusRequest.cs`: `{ TripStatus Status }`
  - [x] Add `Task<TripResponse?> SetTripStatusAsync(Guid userId, Guid tripId, TripStatus status)` to `ITripService`
  - [x] Implement in `TripService`: find trip (null if not found/wrong owner), set `Status` + `UpdatedAt`, save, return `MapToResponse`

- [x] Task 2: Backend — PATCH endpoint (AC: #1)
  - [x] Add `[HttpPatch("{id:guid}/status")]` `SetTripStatus(Guid id, [FromBody] SetTripStatusRequest request)` to `TripsController`
  - [x] Return `Ok(trip)` or `NotFound()`

- [x] Task 3: Backend — Unit tests (AC: #1)
  - [x] `SetTripStatusAsync_UpdatesStatus_WhenOwned`
  - [x] `SetTripStatusAsync_ReturnsNull_WhenNotOwned`

- [x] Task 4: Angular — Add setTripStatus() to TripService (AC: #1)
  - [x] Add `setTripStatus(id: string, status: TripStatus): Observable<Trip>` — `PATCH ${API_BASE_URL}/trips/${id}/status` with JSON body `{ status }`
  - [x] tap updates `_currentTrip` and `_trips` list

- [x] Task 5: Angular — Status selector in TripDetailComponent (AC: #1)
  - [x] Add `isStatusChanging = signal(false)` to component
  - [x] Add `setStatus(status: string)` method: calls `setTripStatus`, sets `isStatusChanging` true/false via finalize
  - [x] Add `<select>` to view-mode template showing all 4 statuses; triggers `setStatus` on change
  - [x] Status badge on trip-list cards already reflects signal — no change needed there

- [x] Task 6: Angular — Unit tests (AC: #1)
  - [x] `trip.service.spec.ts`: `setTripStatus should PATCH /trips/:id/status`, `setTripStatus should update signals`
  - [x] `trip-detail.component.spec.ts`: `should show status select in view mode`

### Review Findings

- [ ] [Review][Patch] Missing `SetTripStatusRequestValidator` — `Status` field has no validator; an empty JSON body silently sets status to `Planning` (enum default 0) with no 400 response [rollplan-api/Models/DTOs/Trips/SetTripStatusRequest.cs]
- [ ] [Review][Patch] `setStatus()` in `TripDetailComponent` has no `error` callback — network/server errors fail silently with no user feedback [rollplan-client/src/app/trips/trip-detail/trip-detail.component.ts]

## Dev Notes

### What Already Exists

- `TripStatus` enum (C#): `Planning, Active, Completed, Archived` in `rollplan-api/Models/Entities/TripStatus.cs`
- `TripStatus` type (Angular): `'Planning' | 'Active' | 'Completed' | 'Archived'` in `trip.service.ts`
- `TripDetailComponent` — view mode template in `trip-detail.component.html`; modify to add status selector
- `MapToResponse()` — reuse in TripService
- `GetCurrentUserId()` — reuse in controller
- No new files beyond `SetTripStatusRequest.cs`

### API

- `PATCH /api/v1/trips/{id}/status` — JSON body `{ "status": "Active" }`, returns updated `TripResponse`
- Status stored as text in DB — EF Core serializes enum to string via existing convention

### Angular

- `setTripStatus` sends JSON (not FormData): `this.http.patch<Trip>(url, { status })`
- Status select in view mode (NOT inside edit form) — immediate update on change, no separate Save button
- `finalize()` to reset `isStatusChanging`

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### File List

- `rollplan-api/Models/DTOs/Trips/SetTripStatusRequest.cs` (new)
- `rollplan-api/Services/ITripService.cs` (modified)
- `rollplan-api/Services/TripService.cs` (modified)
- `rollplan-api/Controllers/TripsController.cs` (modified)
- `rollplan-api-tests/Services/TripServiceTests.cs` (modified)
- `rollplan-client/src/app/trips/services/trip.service.ts` (modified)
- `rollplan-client/src/app/trips/services/trip.service.spec.ts` (modified)
- `rollplan-client/src/app/trips/trip-detail/trip-detail.component.ts` (modified)
- `rollplan-client/src/app/trips/trip-detail/trip-detail.component.html` (modified)
- `rollplan-client/src/app/trips/trip-detail/trip-detail.component.spec.ts` (modified)

### Change Log
