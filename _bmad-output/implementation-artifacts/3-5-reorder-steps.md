# Story 3.5: Reorder Steps

Status: done

## Story

As an **authenticated user**,
I want to reorder steps within a trip,
So that my itinerary reflects the correct sequence of events.

## Acceptance Criteria

1. **Given** an authenticated user viewing the step list for a trip
   **When** they drag and drop a step to a new position
   **Then** the new order is persisted to the database immediately
   **And** the step list reflects the new order without a page reload
   **And** the new order persists on page refresh

2. **Given** a step is dropped at its original position
   **When** previousIndex equals currentIndex
   **Then** no API call is made

3. **Given** a reorder fails on the server
   **When** the API returns an error
   **Then** the step list is restored to its pre-drag order
   **And** an error message is displayed

4. **Given** an authenticated user
   **When** the reorder request is sent
   **Then** only the owner of the trip can reorder its steps (404 for others)

## Tasks / Subtasks

- [x] Task 1: Install Angular CDK (required dependency)
  - [x] Run `npm install @angular/cdk@^21.2.0` in `rollplan-client/`
  - [x] Verify `@angular/cdk` appears in `package.json` dependencies

- [x] Task 2: Backend — Add ReorderStepsRequest DTO and interface method (AC: #1, #4)
  - [x] Create `rollplan-api/Models/DTOs/Steps/ReorderStepsRequest.cs` with a single property `public List<Guid> StepIds { get; set; } = new();`
  - [x] In `rollplan-api/Services/IStepService.cs`: add `Task<IEnumerable<StepResponse>?> ReorderStepsAsync(Guid userId, Guid tripId, ReorderStepsRequest request);`

- [x] Task 3: Backend — Implement ReorderStepsAsync and controller endpoint (AC: #1, #4)
  - [x] In `rollplan-api/Services/StepService.cs`: implement `ReorderStepsAsync` — find trip by `tripId && userId`, return null if not owned; load all steps for the trip; assign `SortOrder = index + 1` to each step in `request.StepIds` order; call `SaveChangesAsync`; return steps ordered by SortOrder via `MapToResponse`
  - [x] In `rollplan-api/Controllers/StepsController.cs`: add `[HttpPut("reorder")]` action `ReorderSteps(Guid tripId, [FromBody] ReorderStepsRequest request)` — call `ReorderStepsAsync`; return `Ok(steps)` or `NotFound()`

- [x] Task 4: Backend — Unit tests (AC: #1, #4)
  - [x] In `rollplan-api-tests/Services/StepServiceTests.cs`: add `ReorderStepsAsync_ReordersSteps_WhenOwned` — seed trip + 3 steps, call with reversed ID order, assert SortOrder values are correctly reassigned (first ID gets SortOrder 1, etc.)
  - [x] Add `ReorderStepsAsync_ReturnsNull_WhenTripNotOwned` — seed trip with different owner, assert null returned and sort orders unchanged

- [x] Task 5: Angular — Add reorderSteps to StepService (AC: #1, #3)
  - [x] In `rollplan-client/src/app/steps/services/step.service.ts`: add `reorderSteps(tripId: string, stepIds: string[]): Observable<Step[]>` — capture `snapshot = this._steps()` before the call; optimistically update `this._steps.set(stepIds.map((id, i) => ({...snapshot.find(s => s.id === id)!, sortOrder: i + 1})))`; send `PUT ${API_BASE_URL}/trips/${tripId}/steps/reorder` with `{ stepIds }`; use `tap(updated => this._steps.set(updated))` on success; use `catchError(err => { this._steps.set(snapshot); return throwError(() => err); })` on failure
  - [x] Add required imports: `catchError` from `'rxjs/operators'`, `throwError` from `'rxjs'`

- [x] Task 6: Angular — Add drag-and-drop UI to StepListComponent (AC: #1, #2, #3)
  - [x] In `rollplan-client/src/app/steps/step-list/step-list.component.ts`:
    - [x] Add imports: `CdkDragDrop`, `CdkDropList`, `CdkDrag`, `CdkDragPlaceholder`, `moveItemInArray` from `'@angular/cdk/drag-drop'`
    - [x] Add `CdkDropList`, `CdkDrag`, `CdkDragPlaceholder` to the component `imports` array
    - [x] Add `reorderError = signal<string | null>(null)` signal
    - [x] Add `onDrop(event: CdkDragDrop<Step[]>): void` — if `event.previousIndex === event.currentIndex`, return immediately; build `stepIds` by cloning `steps()` into a temp array, calling `moveItemInArray(temp, prev, curr)`, then mapping to IDs; call `this.stepService.reorderSteps(this.tripId, stepIds)` with error handler setting `reorderError`
  - [x] In `rollplan-client/src/app/steps/step-list/step-list.component.html`:
    - [x] Wrap the `*ngFor` step list `<div>` container with `cdkDropList [cdkDropListData]="steps()" (cdkDropListDropped)="onDrop($event)"`
    - [x] Add `cdkDrag` directive to the per-step card `<div *ngFor="let step of steps()">`
    - [x] Add a `<div *cdkDragPlaceholder>` inside the step card as the drag placeholder (dashed border style)
    - [x] Add a drag handle `<div cdkDragHandle>` with a grip icon (`⠿` or `≡`) inside VIEW MODE to avoid interfering with Edit/Delete buttons
    - [x] Show `reorderError()` above the step list when non-null

- [x] Task 7: Angular — Unit tests (AC: #1, #2)
  - [x] In `rollplan-client/src/app/steps/step-list/step-list.component.spec.ts`:
    - [x] Add `reorderStepsSpy` to the mock `StepService` stub
    - [x] Add test: `should call reorderSteps when step is dropped at new position` — call `onDrop` with a mock `CdkDragDrop` event (`previousIndex: 0, currentIndex: 1`, `container.data: [mockStep, mockStep2]`), assert `reorderStepsSpy` called with correct tripId and reordered IDs
    - [x] Add test: `should not call reorderSteps when dropped at same position` — call `onDrop` with `previousIndex: 0, currentIndex: 0`, assert `reorderStepsSpy` not called

### Review Findings

- [x] [Review][Patch] Non-null assertion on `snapshot.find()` can spread `undefined` into optimistic state [rollplan-client/src/app/steps/services/step.service.ts]
- [x] [Review][Patch] Missing FluentValidation validator for `ReorderStepsRequest` — empty `StepIds` passes silently to service [rollplan-api/Models/DTOs/Steps/ReorderStepsRequest.cs]
- [x] [Review][Patch] No Angular unit test covering `onDrop` error path (`reorderError` signal not tested) — AC #3 [rollplan-client/src/app/steps/step-list/step-list.component.spec.ts]
- [x] [Review][Defer] Steps missing from `StepIds` retain stale SortOrder (v1 intentional per Dev Notes) [rollplan-api/Services/StepService.cs] — deferred, v1 by design
- [x] [Review][Defer] Response sorted from in-memory list, not re-queried DB state (consequence of above) [rollplan-api/Services/StepService.cs] — deferred, v1 by design
- [x] [Review][Defer] Race condition on concurrent reorder requests (no row locking or optimistic concurrency) — deferred, architectural, out of scope v1
- [x] [Review][Defer] No validation that all `StepIds` belong to the trip (foreign IDs silently skipped, no IDOR risk) — deferred, v1 by design per Dev Notes
- [x] [Review][Defer] `subscribe()` without `takeUntilDestroyed` — pre-existing pattern in all service calls — deferred, pre-existing
- [x] [Review][Defer] `onDrop` reads `this.steps()` signal rather than `event.container.data` — index drift theoretical in single-user context — deferred, pre-existing
- [x] [Review][Defer] No backend tests for edge cases (partial StepIds, empty list, duplicate IDs) — deferred, low priority
- [x] [Review][Defer] Duplicate IDs in `StepIds` cause last-write-wins corruption on same step — deferred, edge case

## Dev Notes

### Prerequisite: Install Angular CDK

```bash
cd rollplan-client && npm install @angular/cdk@^21.2.0
```

This is a required new dependency. `@angular/cdk` must match the Angular major version (Angular 21 → CDK 21).

### Backend: ReorderStepsRequest DTO

```csharp
namespace RollPlan.Api.Models.DTOs.Steps;

public class ReorderStepsRequest
{
    public List<Guid> StepIds { get; set; } = new();
}
```

No validator needed for v1 — the service handles validation implicitly (missing/extra IDs are ignored or skip sort assignment).

### Backend: ReorderStepsAsync Implementation

```csharp
public async Task<IEnumerable<StepResponse>?> ReorderStepsAsync(Guid userId, Guid tripId, ReorderStepsRequest request)
{
    var trip = await _dbContext.Trips
        .FirstOrDefaultAsync(t => t.Id == tripId && t.UserId == userId);

    if (trip is null) return null;

    var steps = await _dbContext.Steps
        .Where(s => s.TripId == tripId)
        .ToListAsync();

    for (int i = 0; i < request.StepIds.Count; i++)
    {
        var step = steps.FirstOrDefault(s => s.Id == request.StepIds[i]);
        if (step is not null)
            step.SortOrder = i + 1;
    }

    await _dbContext.SaveChangesAsync();

    return steps.OrderBy(s => s.SortOrder).Select(MapToResponse);
}
```

### Backend: StepsController — New Endpoint

Add before `UpdateStep` (or in any order — route constraint `:guid` ensures "reorder" literal never matches the `{stepId:guid}` routes):

```csharp
[HttpPut("reorder")]
public async Task<IActionResult> ReorderSteps(Guid tripId, [FromBody] ReorderStepsRequest request)
{
    var userId = GetCurrentUserId();
    var steps = await _stepService.ReorderStepsAsync(userId, tripId, request);
    return steps is null ? NotFound() : Ok(steps);
}
```

**Route conflict note:** `[HttpPut("reorder")]` and `[HttpPut("{stepId:guid}")]` do NOT conflict — the `:guid` constraint rejects the literal string "reorder". Order of declaration does not matter.

### Angular: reorderSteps in StepService

```typescript
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

reorderSteps(tripId: string, stepIds: string[]): Observable<Step[]> {
  const snapshot = this._steps();
  const optimistic = stepIds.map((id, i) => ({
    ...snapshot.find(s => s.id === id)!,
    sortOrder: i + 1
  }));
  this._steps.set(optimistic);

  return this.http
    .put<Step[]>(`${API_BASE_URL}/trips/${tripId}/steps/reorder`, { stepIds })
    .pipe(
      tap(updated => this._steps.set(updated)),
      catchError(err => {
        this._steps.set(snapshot);
        return throwError(() => err);
      })
    );
}
```

### Angular: onDrop Method

```typescript
import { CdkDragDrop, CdkDropList, CdkDrag, CdkDragPlaceholder, moveItemInArray } from '@angular/cdk/drag-drop';

reorderError = signal<string | null>(null);

onDrop(event: CdkDragDrop<Step[]>): void {
  if (event.previousIndex === event.currentIndex) return;

  const reordered = [...this.steps()];
  moveItemInArray(reordered, event.previousIndex, event.currentIndex);
  const stepIds = reordered.map(s => s.id);

  this.reorderError.set(null);
  this.stepService.reorderSteps(this.tripId, stepIds).subscribe({
    error: () => this.reorderError.set('Failed to reorder steps. Order has been restored.')
  });
}
```

Add `CdkDropList`, `CdkDrag`, `CdkDragPlaceholder` to component `imports: [CommonModule, ReactiveFormsModule, PlacesAutocompleteDirective, CdkDropList, CdkDrag, CdkDragPlaceholder]`.

### Angular: HTML Template Changes

Replace the `<div *ngIf="steps().length > 0" class="space-y-3 mb-4">` wrapper with:

```html
<div *ngIf="steps().length > 0">
  <p *ngIf="reorderError()" class="mb-3 text-xs text-red-400">{{ reorderError() }}</p>

  <div
    cdkDropList
    [cdkDropListData]="steps()"
    (cdkDropListDropped)="onDrop($event)"
    class="space-y-3 mb-4"
  >
    <div
      *ngFor="let step of steps()"
      cdkDrag
      class="rounded-2xl bg-slate-900/60 p-4 ring-1 ring-white/10"
    >
      <div *cdkDragPlaceholder class="rounded-2xl border-2 border-dashed border-slate-600 bg-slate-900/30 h-16"></div>

      <!-- VIEW MODE -->
      <ng-container *ngIf="editingStepId() !== step.id">
        <div class="flex items-start justify-between gap-3">
          <div class="flex items-center gap-2 shrink-0">
            <div cdkDragHandle class="cursor-grab text-slate-600 hover:text-slate-400 px-1 select-none" title="Drag to reorder">⠿</div>
          </div>
          <div class="min-w-0 flex-1">
            <!-- existing step info content -->
          </div>
          <div class="flex items-center gap-3 shrink-0">
            <!-- existing Edit / Delete buttons -->
          </div>
        </div>
        <!-- existing delete confirm block -->
      </ng-container>

      <!-- EDIT MODE (unchanged) -->
    </div>
  </div>
</div>
```

**Important:** Only add `cdkDropList`, `cdkDrag`, `cdkDragPlaceholder`, and `cdkDragHandle` directives. Do NOT restructure the existing step card content — preserve all existing VIEW MODE / EDIT MODE markup exactly. Only add the drag wrapper attributes and handle element.

### Angular Unit Tests

For testing `onDrop` without full CDK setup, create a minimal mock `CdkDragDrop` event object:

```typescript
import { CdkDragDrop } from '@angular/cdk/drag-drop';

const mockStep2: Step = {
  id: '33333333-3333-3333-3333-333333333333',
  tripId: '11111111-1111-1111-1111-111111111111',
  name: 'Hotel Check-in',
  type: 'Accommodation',
  sortOrder: 2,
  createdAt: '2026-05-09T10:00:00Z',
  updatedAt: '2026-05-09T10:00:00Z'
};

it('should call reorderSteps when step is dropped at new position', () => {
  getStepsSpy.mockReturnValue(of([mockStep, mockStep2]));
  reorderStepsSpy.mockReturnValue(of([mockStep2, mockStep]));
  stepsSignal.set([mockStep, mockStep2]);
  const fixture = TestBed.createComponent(StepListComponent);
  fixture.componentInstance.tripId = '11111111-1111-1111-1111-111111111111';
  fixture.detectChanges();

  const dropEvent = {
    previousIndex: 0,
    currentIndex: 1,
    item: {} as any,
    container: { data: [mockStep, mockStep2] } as any,
    previousContainer: { data: [mockStep, mockStep2] } as any,
    isPointerOverContainer: true,
    distance: { x: 0, y: 0 },
    dropPoint: { x: 0, y: 0 }
  } as CdkDragDrop<Step[]>;

  fixture.componentInstance.onDrop(dropEvent);
  expect(reorderStepsSpy).toHaveBeenCalledWith(
    '11111111-1111-1111-1111-111111111111',
    [mockStep2.id, mockStep.id]
  );
});

it('should not call reorderSteps when dropped at same position', () => {
  getStepsSpy.mockReturnValue(of([mockStep]));
  stepsSignal.set([mockStep]);
  const fixture = TestBed.createComponent(StepListComponent);
  fixture.componentInstance.tripId = '11111111-1111-1111-1111-111111111111';
  fixture.detectChanges();

  const dropEvent = {
    previousIndex: 0,
    currentIndex: 0,
    item: {} as any,
    container: { data: [mockStep] } as any,
    previousContainer: { data: [mockStep] } as any,
    isPointerOverContainer: true,
    distance: { x: 0, y: 0 },
    dropPoint: { x: 0, y: 0 }
  } as CdkDragDrop<Step[]>;

  fixture.componentInstance.onDrop(dropEvent);
  expect(reorderStepsSpy).not.toHaveBeenCalled();
});
```

### Map Route AC

The AC "the map route updates to reflect the new order" is satisfied automatically: the `_steps` signal is updated with the new sorted order by `reorderSteps`. When Epic 4 (Map Visualization) is implemented, it will read from the same signal and see the correct order. No map-specific code is needed in this story.

### SortOrder Strategy

- After reorder, SortOrder values are reassigned as contiguous integers 1..N
- This resolves any gaps left by previous deletions (story 3.4)
- The backend assigns the new sort orders based on the array position in `StepIds`

### No Migration Needed

`SortOrder` column already exists on the `steps` table.

### API

New endpoint: `PUT /api/v1/trips/{tripId}/steps/reorder` — JWT required, body `{ "stepIds": ["guid1", "guid2", ...] }`, returns `StepResponse[]` with updated sort orders, 404 if trip not owned.

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### File List

- `rollplan-api/Models/DTOs/Steps/ReorderStepsRequest.cs` (new)
- `rollplan-api/Services/IStepService.cs` (modified)
- `rollplan-api/Services/StepService.cs` (modified)
- `rollplan-api/Controllers/StepsController.cs` (modified)
- `rollplan-api-tests/Services/StepServiceTests.cs` (modified)
- `rollplan-client/package.json` (modified — @angular/cdk added)
- `rollplan-client/package-lock.json` (modified)
- `rollplan-client/src/app/steps/services/step.service.ts` (modified)
- `rollplan-client/src/app/steps/step-list/step-list.component.ts` (modified)
- `rollplan-client/src/app/steps/step-list/step-list.component.html` (modified)
- `rollplan-client/src/app/steps/step-list/step-list.component.spec.ts` (modified)
- `rollplan-api/Models/DTOs/Steps/ReorderStepsRequestValidator.cs` (new)

### Change Log

- 2026-05-10: Implemented story 3-5-reorder-steps — installed @angular/cdk, added ReorderStepsRequest DTO, ReorderStepsAsync service method and PUT reorder endpoint, 2 backend unit tests, reorderSteps Angular service method with optimistic update + catchError rollback, CdkDropList/CdkDrag/cdkDragHandle UI in StepListComponent, 2 Angular unit tests. 108/108 tests pass.
