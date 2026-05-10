# Story 3.4: Delete Step

Status: ready-for-dev

## Story

As an **authenticated user**,
I want to delete a step after confirming,
So that I can remove unwanted items from my itinerary.

## Acceptance Criteria

1. **Given** an authenticated user viewing the step list
   **When** they click the Delete button on a step card
   **Then** an inline confirmation prompt appears within that card
   **And** the confirmation text clearly states the action is permanent

2. **Given** the inline confirmation is visible
   **When** the user confirms the delete
   **Then** the step is permanently deleted from the database
   **And** the step disappears from the list immediately (no page reload)
   **And** the remaining steps are still displayed in their correct order

3. **Given** the inline confirmation is visible
   **When** the user clicks Cancel
   **Then** the confirmation prompt closes with no changes made

4. **Given** an authenticated user
   **When** the delete request is sent
   **Then** only the owner of the trip can delete steps in it (403/404 for others)

## Tasks / Subtasks

- [ ] Task 1: Backend — Add DeleteStepAsync to service and interface (AC: #2, #4)
  - [ ] In `rollplan-api/Services/IStepService.cs`: add `Task<bool> DeleteStepAsync(Guid userId, Guid tripId, Guid stepId);`
  - [ ] In `rollplan-api/Services/StepService.cs`: implement `DeleteStepAsync` — find trip by `tripId && userId`, return `false` if not owned; find step by `stepId && TripId == tripId`, return `false` if not found; call `_dbContext.Steps.Remove(step)` then `SaveChangesAsync()`; return `true`

- [ ] Task 2: Backend — Add DELETE endpoint to StepsController (AC: #2, #4)
  - [ ] In `rollplan-api/Controllers/StepsController.cs`: add `[HttpDelete("{stepId:guid}")]` action `DeleteStep(Guid tripId, Guid stepId)` — call `DeleteStepAsync(userId, tripId, stepId)`; return `NoContent()` if true, `NotFound()` if false

- [ ] Task 3: Backend — Unit tests (AC: #2, #4)
  - [ ] In `rollplan-api-tests/Services/StepServiceTests.cs`: add `DeleteStepAsync_DeletesStep_WhenOwned` — seed trip + step, call DeleteStepAsync, assert `true` returned and step no longer in DB
  - [ ] Add `DeleteStepAsync_ReturnsFalse_WhenTripNotOwned` — seed trip with different owner userId, assert `false` returned and step still in DB unchanged
  - [ ] Add `DeleteStepAsync_ReturnsFalse_WhenStepNotFound` — seed trip owned by user, pass non-existent stepId, assert `false` returned

- [ ] Task 4: Angular — Add deleteStep method to StepService (AC: #2)
  - [ ] In `rollplan-client/src/app/steps/services/step.service.ts`: add `deleteStep(tripId: string, stepId: string): Observable<void>` — `DELETE ${API_BASE_URL}/trips/${tripId}/steps/${stepId}` with `tap(() => this._steps.update(list => list.filter(s => s.id !== stepId)))`

- [ ] Task 5: Angular — Add inline delete confirmation to StepListComponent (AC: #1, #2, #3)
  - [ ] In `rollplan-client/src/app/steps/step-list/step-list.component.ts`:
    - [ ] Add `deletingStepId = signal<string | null>(null)` signal — tracks which step is awaiting delete confirmation
    - [ ] Add `isDeletingStep = signal(false)` signal — true while DELETE request is in-flight
    - [ ] Add `confirmDelete(step: Step): void` — sets `deletingStepId.set(step.id)`
    - [ ] Add `cancelDelete(): void` — sets `deletingStepId.set(null)`
    - [ ] Add `doDelete(): void` — guards `isDeletingStep()` double-submit; sets `isDeletingStep(true)`; calls `stepService.deleteStep(this.tripId, this.deletingStepId()!)`; on success: `deletingStepId.set(null)`; on error: sets a `deleteError` signal with `'Failed to delete step.'`; always calls `finalize(() => isDeletingStep.set(false))`
    - [ ] Add `deleteError = signal<string | null>(null)` for delete error display
  - [ ] In `rollplan-client/src/app/steps/step-list/step-list.component.html` — within the existing VIEW MODE `<ng-container>` for each step:
    - [ ] Add a "Delete" button alongside the existing "Edit" button in the actions row
    - [ ] Below the step info row, add an inline confirm block `*ngIf="deletingStepId() === step.id"` containing: confirmation message (`"Remove this step? This cannot be undone."`), a red "Delete" button with `[disabled]="isDeletingStep()"` and `(click)="doDelete()"`, and a "Cancel" button with `(click)="cancelDelete()"`
    - [ ] Optionally show `deleteError()` within the confirm block

- [ ] Task 6: Angular — Unit tests (AC: #1, #2, #3)
  - [ ] In `rollplan-client/src/app/steps/step-list/step-list.component.spec.ts`:
    - [ ] Add `deleteStepSpy` to the mock `StepService` stub (returns `of(undefined)` by default)
    - [ ] Add test: `should show confirm dialog when confirmDelete is called` — seed step in signal, call `confirmDelete(mockStep)`, assert `deletingStepId()` equals `mockStep.id`
    - [ ] Add test: `should hide confirm dialog on cancelDelete` — call `confirmDelete(mockStep)` then `cancelDelete()`, assert `deletingStepId()` is null
    - [ ] Add test: `should call deleteStep on doDelete` — call `confirmDelete(mockStep)`, then `doDelete()`, assert `deleteStepSpy` called with tripId and mockStep.id

## Dev Notes

### What Already Exists — Reuse These Patterns

**Backend:**
- `TripService.DeleteTripAsync` — exact pattern to copy: ownership check → `_dbContext.Trips.Remove(trip)` → `SaveChangesAsync()` → return `true`; return `false` if trip not owned or not found. `DeleteStepAsync` is identical except it also checks step ownership via `s.TripId == tripId`.
- `StepsController.UpdateStep` — `[HttpPut("{stepId:guid}")]` pattern; `DeleteStep` uses `[HttpDelete("{stepId:guid}")]` instead, same parameter binding, returns `NoContent()` on success (not `Ok(step)`).
- `TripsController.DeleteTrip` → `deleted ? NoContent() : NotFound()` — same return pattern.
- `StepServiceTests` — seed helpers `SeedTrip(Guid? userId = null)` and `SeedStep(Guid tripId, int sortOrder)` already exist; use them directly for delete tests.

**Angular:**
- `TripService.deleteTrip` in `trip.service.ts`:
  ```typescript
  deleteTrip(id: string): Observable<void> {
    return this.http.delete<void>(`${API_BASE_URL}/trips/${id}`)
      .pipe(tap(() => this._trips.update(list => list.filter(t => t.id !== id))));
  }
  ```
  Copy this pattern for `deleteStep`: `http.delete<void>(url).pipe(tap(() => this._steps.update(list => list.filter(s => s.id !== stepId))))`

- `TripDetailComponent.confirmDelete/cancelDelete/doDelete/isDeleting/showConfirm` — the inline confirm dialog pattern to replicate in StepListComponent. Key difference: TripDetailComponent has one delete target (the trip itself), StepListComponent has multiple targets (one per step card), so track WHICH step is confirming via `deletingStepId = signal<string | null>(null)` instead of `showConfirm = signal(false)`.

- `finalize` operator — already imported in `StepListComponent` from `rxjs/operators`; use same pattern as `onEditSubmit`.

### Backend: DeleteStepAsync Implementation

```csharp
public async Task<bool> DeleteStepAsync(Guid userId, Guid tripId, Guid stepId)
{
    var trip = await _dbContext.Trips
        .FirstOrDefaultAsync(t => t.Id == tripId && t.UserId == userId);

    if (trip is null) return false;

    var step = await _dbContext.Steps
        .FirstOrDefaultAsync(s => s.Id == stepId && s.TripId == tripId);

    if (step is null) return false;

    _dbContext.Steps.Remove(step);
    await _dbContext.SaveChangesAsync();

    return true;
}
```

### Backend: StepsController — New Endpoint

Add after `UpdateStep`:

```csharp
[HttpDelete("{stepId:guid}")]
public async Task<IActionResult> DeleteStep(Guid tripId, Guid stepId)
{
    var userId = GetCurrentUserId();
    var deleted = await _stepService.DeleteStepAsync(userId, tripId, stepId);
    return deleted ? NoContent() : NotFound();
}
```

### Angular: deleteStep in StepService

```typescript
deleteStep(tripId: string, stepId: string): Observable<void> {
  return this.http
    .delete<void>(`${API_BASE_URL}/trips/${tripId}/steps/${stepId}`)
    .pipe(tap(() => this._steps.update(list => list.filter(s => s.id !== stepId))));
}
```

### Angular: New Signals and Methods in StepListComponent

```typescript
deletingStepId = signal<string | null>(null);
isDeletingStep = signal(false);
deleteError = signal<string | null>(null);

confirmDelete(step: Step): void {
  this.deletingStepId.set(step.id);
  this.deleteError.set(null);
}

cancelDelete(): void {
  this.deletingStepId.set(null);
  this.deleteError.set(null);
}

doDelete(): void {
  const stepId = this.deletingStepId();
  if (!stepId || this.isDeletingStep()) return;

  this.isDeletingStep.set(true);
  this.deleteError.set(null);

  this.stepService.deleteStep(this.tripId, stepId)
    .pipe(finalize(() => this.isDeletingStep.set(false)))
    .subscribe({
      next: () => this.deletingStepId.set(null),
      error: () => this.deleteError.set('Failed to delete step.')
    });
}
```

### Angular: HTML Changes to Step Card VIEW MODE

**Add Delete button** to the actions row (alongside existing Edit button):

```html
<div class="flex items-center gap-3 shrink-0">
  <button
    type="button"
    (click)="startEdit(step)"
    class="text-xs text-slate-400 hover:text-sky-400 transition"
  >Edit</button>
  <button
    type="button"
    (click)="confirmDelete(step)"
    class="text-xs text-slate-400 hover:text-red-400 transition"
  >Delete</button>
  <span class="text-xs text-slate-600">#{{ step.sortOrder }}</span>
</div>
```

**Add inline confirm block** below the step info row, still inside the VIEW MODE `<ng-container>`:

```html
<div *ngIf="deletingStepId() === step.id" class="mt-4 rounded-2xl border border-red-700 bg-red-950/40 p-4">
  <p class="text-sm text-red-300">Remove this step? This cannot be undone.</p>
  <p *ngIf="deleteError()" class="mt-1 text-xs text-red-400">{{ deleteError() }}</p>
  <div class="mt-3 flex gap-3">
    <button
      type="button"
      (click)="doDelete()"
      [disabled]="isDeletingStep()"
      class="inline-flex items-center justify-center rounded-2xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <span *ngIf="isDeletingStep(); else deleteLabel">Deleting…</span>
      <ng-template #deleteLabel>Delete</ng-template>
    </button>
    <button
      type="button"
      (click)="cancelDelete()"
      class="inline-flex items-center justify-center rounded-2xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-slate-800"
    >
      Cancel
    </button>
  </div>
</div>
```

### Angular Unit Test Additions

```typescript
// in beforeEach stub, add:
deleteStepSpy = vi.fn();
const stepServiceStub = {
  steps: stepsSignal.asReadonly(),
  getSteps: getStepsSpy,
  addStep: addStepSpy,
  updateStep: updateStepSpy,
  deleteStep: deleteStepSpy
};

// new tests:
it('should show confirm dialog when confirmDelete is called', () => {
  getStepsSpy.mockReturnValue(of([mockStep]));
  const fixture = TestBed.createComponent(StepListComponent);
  fixture.componentInstance.tripId = '11111111-1111-1111-1111-111111111111';
  stepsSignal.set([mockStep]);
  fixture.detectChanges();

  fixture.componentInstance.confirmDelete(mockStep);
  expect(fixture.componentInstance.deletingStepId()).toBe(mockStep.id);
});

it('should hide confirm dialog on cancelDelete', () => {
  getStepsSpy.mockReturnValue(of([mockStep]));
  const fixture = TestBed.createComponent(StepListComponent);
  fixture.componentInstance.tripId = '11111111-1111-1111-1111-111111111111';
  fixture.detectChanges();

  fixture.componentInstance.confirmDelete(mockStep);
  fixture.componentInstance.cancelDelete();
  expect(fixture.componentInstance.deletingStepId()).toBeNull();
});

it('should call deleteStep on doDelete', () => {
  getStepsSpy.mockReturnValue(of([mockStep]));
  deleteStepSpy.mockReturnValue(of(undefined));
  const fixture = TestBed.createComponent(StepListComponent);
  fixture.componentInstance.tripId = '11111111-1111-1111-1111-111111111111';
  fixture.detectChanges();

  fixture.componentInstance.confirmDelete(mockStep);
  fixture.componentInstance.doDelete();
  expect(deleteStepSpy).toHaveBeenCalledWith(
    '11111111-1111-1111-1111-111111111111',
    mockStep.id
  );
});
```

### SortOrder After Deletion

**Do NOT rebalance SortOrder values after deletion.** A gap in SortOrder (e.g., 1, 3, 4 after deleting step 2) is correct and expected — steps are still ordered correctly by their relative values. Story 3.5 (Reorder Steps) owns all SortOrder mutation logic.

### Note and Photo Fields

`Step.Note` is a column on the Step entity — it is deleted automatically with the row. Photos are scoped to Epic 5 and do not exist in the schema yet. No additional cleanup logic is needed.

### No Migration Needed

Deleting a row requires no schema changes.

### API

New endpoint: `DELETE /api/v1/trips/{tripId}/steps/{stepId}` — JWT required, returns `204 No Content` on success, `404` if trip not owned or step not found.

## Dev Agent Record

### Agent Model Used

(to be filled)

### File List

- `rollplan-api/Services/IStepService.cs` (modified)
- `rollplan-api/Services/StepService.cs` (modified)
- `rollplan-api/Controllers/StepsController.cs` (modified)
- `rollplan-api-tests/Services/StepServiceTests.cs` (modified)
- `rollplan-client/src/app/steps/services/step.service.ts` (modified)
- `rollplan-client/src/app/steps/step-list/step-list.component.ts` (modified)
- `rollplan-client/src/app/steps/step-list/step-list.component.html` (modified)
- `rollplan-client/src/app/steps/step-list/step-list.component.spec.ts` (modified)

### Change Log

(to be filled)
