# Story 2.5: Delete Trip

Status: review

## Story

As an **authenticated user**,
I want to delete a trip after confirming,
So that I can remove trips I no longer need.

## Acceptance Criteria

1. **Given** an authenticated user viewing a trip
   **When** they trigger delete and confirm the confirmation dialog
   **Then** the trip and all its steps, photos, and data are permanently deleted
   **And** they are redirected to the trip list page
   **And** cancelling the confirmation dialog does nothing
   **And** the confirmation dialog clearly states the action is permanent

## Tasks / Subtasks

- [x] Task 1: Backend — DeleteTripAsync + DELETE endpoint (AC: #1)
  - [x] Add `Task<bool> DeleteTripAsync(Guid userId, Guid tripId)` to `ITripService`
  - [x] Implement in `TripService`: find trip (return false if not found/wrong owner), delete cover image from storage if exists, remove from DB, return true
  - [x] Add `[HttpDelete("{id:guid}")]` `DeleteTrip(Guid id)` to `TripsController`: return `NoContent()` (204) or `NotFound()`

- [x] Task 2: Backend — Unit tests (AC: #1)
  - [x] `DeleteTripAsync_DeletesTrip_WhenOwned` — seed trip, delete, verify removed from DB
  - [x] `DeleteTripAsync_ReturnsFalse_WhenNotOwned` — other user's trip, verify false + DB unchanged

- [x] Task 3: Angular — Add deleteTrip() to TripService (AC: #1)
  - [x] Add `deleteTrip(id: string): Observable<void>` — `DELETE ${API_BASE_URL}/trips/${id}`, tap removes trip from `_trips` signal and clears `_currentTrip`

- [x] Task 4: Angular — Delete button + confirm dialog in TripDetailComponent (AC: #1)
  - [x] Add `isDeleting = signal(false)`, `showConfirm = signal(false)` to component
  - [x] Add `confirmDelete()` and `cancelDelete()` and `doDelete()` methods
  - [x] Add "Delete Trip" button in view mode that sets `showConfirm(true)`
  - [x] Add inline confirm dialog: message "This will permanently delete the trip and all its data. This action cannot be undone.", "Delete" button calls `doDelete()`, "Cancel" calls `cancelDelete()`
  - [x] `doDelete()`: sets `isDeleting(true)`, calls `deleteTrip`, on success navigates to `/trips`; finalize resets `isDeleting`

- [x] Task 5: Angular — Unit tests (AC: #1)
  - [x] `trip.service.spec.ts`: `deleteTrip should DELETE /trips/:id`, `deleteTrip should remove trip from signals`
  - [x] `trip-detail.component.spec.ts`: `should show confirm dialog when showConfirm is true`, `should hide confirm dialog when cancel clicked`

## Dev Notes

### What Already Exists

- `TripService` (C#): `MapToResponse()`, `_storageService` — reuse for cover image deletion
- `TripsController`: `GetCurrentUserId()` — reuse
- `TripDetailComponent`: `tripId`, `router` field already set up from Story 2.3 — use `router.navigate(['/trips'])` on success
- DB cascade: Trip entity has `OnDelete(DeleteBehavior.Cascade)` on User FK. Steps/photos don't exist yet (Epic 3+), so just removing the Trip entity suffices
- `_trips` signal update: `_trips.update(list => list.filter(t => t.id !== id))`

### API

- `DELETE /api/v1/trips/{id}` — returns `204 No Content` on success, `404 Not Found` if not found/wrong owner

### Angular

- `deleteTrip` Observable returns `void` — use `this.http.delete<void>(...)`
- Confirm dialog is inline HTML (no modal library needed) — toggle via `showConfirm` signal
- Do NOT use browser `confirm()` — inline dialog in template required

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### File List

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
