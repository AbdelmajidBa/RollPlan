# Story 3.3: Edit Step Details

Status: done

## Story

As an **authenticated user**,
I want to edit any step's details,
So that I can keep the itinerary up to date.

## Acceptance Criteria

1. **Given** an authenticated user viewing the step list for a trip
   **When** they click the edit button on a step card
   **Then** an inline edit form appears for that step, pre-populated with its current values
   **And** all fields (name, type, location, date, time) are editable
   **And** the location field uses Google Places autocomplete (same fallback behaviour as add-step)

2. **Given** an authenticated user editing a step
   **When** they submit the form with valid changes
   **Then** the step is updated in the database
   **And** the updated values are immediately reflected in the step list UI without a page reload
   **And** the edit form is hidden after a successful save

3. **Given** an authenticated user editing a step
   **When** they click Cancel
   **Then** the edit form closes with no changes made

4. **Given** invalid input in the edit form (e.g. empty name)
   **Then** inline validation errors are shown and the form is not submitted

## Tasks / Subtasks

- [x] Task 1: Backend — Add UpdateStepRequest DTO + validator (AC: #2, #4)
  - [x] Create `rollplan-api/Models/DTOs/Steps/UpdateStepRequest.cs` — same fields as `CreateStepRequest` (Name, Type, Location, Latitude?, Longitude?, Date?, StartTime?); Name is required
  - [x] Create `rollplan-api/Models/DTOs/Steps/UpdateStepRequestValidator.cs` — copy the same rules from `CreateStepRequestValidator`: Name NotEmpty + MaxLength(200), Type IsInEnum, Latitude/Longitude range + pair validation (both or neither)

- [x] Task 2: Backend — Add UpdateStepAsync to service + controller (AC: #2)
  - [x] In `rollplan-api/Services/IStepService.cs`: add `Task<StepResponse?> UpdateStepAsync(Guid userId, Guid tripId, Guid stepId, UpdateStepRequest request);`
  - [x] In `rollplan-api/Services/StepService.cs`: implement `UpdateStepAsync` — find trip by `tripId && userId`, return null if not owned; find step by `stepId && TripId == tripId`, return null if not found; update all fields (Name, Type, Location, Latitude, Longitude, Date, StartTime, UpdatedAt = DateTime.UtcNow); call `SaveChangesAsync`; return `MapToResponse(step)`
  - [x] In `rollplan-api/Controllers/StepsController.cs`: add `[HttpPut("{stepId:guid}")]` `UpdateStep(Guid tripId, Guid stepId, [FromBody] UpdateStepRequest request)` — call `_stepService.UpdateStepAsync(userId, tripId, stepId, request)`; return `Ok(step)` or `NotFound()`

- [x] Task 3: Backend — Unit tests (AC: #2, #4)
  - [x] In `rollplan-api-tests/Services/StepServiceTests.cs`: add `UpdateStepAsync_UpdatesStep_WhenOwned` — seed trip + step, call UpdateStepAsync with changed values, assert response fields updated and DB entity updated
  - [x] Add `UpdateStepAsync_ReturnsNull_WhenTripNotOwned` — seed trip owned by different user, assert null returned, step unchanged
  - [x] Add `UpdateStepAsync_ReturnsNull_WhenStepNotFound` — seed trip owned by user, pass non-existent stepId, assert null returned

- [x] Task 4: Angular — Add UpdateStepRequest interface and updateStep method to StepService (AC: #2)
  - [x] In `rollplan-client/src/app/steps/services/step.service.ts`: add `UpdateStepRequest` interface (same fields as `CreateStepRequest`: name, type, location?, latitude?, longitude?, date?, startTime?)
  - [x] Add `updateStep(tripId: string, stepId: string, request: UpdateStepRequest): Observable<Step>` method — `PUT ${API_BASE_URL}/trips/${tripId}/steps/${stepId}` with `tap` that updates the matching step in `_steps` signal: `this._steps.update(list => list.map(s => s.id === stepId ? updated : s))`

- [x] Task 5: Angular — Add inline edit mode to StepListComponent (AC: #1, #2, #3, #4)
  - [x] In `rollplan-client/src/app/steps/step-list/step-list.component.ts`:
    - [x] Add `editingStepId = signal<string | null>(null)` signal
    - [x] Add `isEditSubmitting = signal(false)` and `editFormError = signal<string | null>(null)` signals
    - [x] Add `readonly editForm: FormGroup` with the same fields as `form` (name, type, location, latitude, longitude, date, startTime) — same validators
    - [x] Add `editLocationSub: Subscription` for location-clear-coordinates side effect (same pattern as `locationSub`)
    - [x] Wire `editLocationSub` in constructor; unsubscribe in `ngOnDestroy` (alongside `locationSub.unsubscribe()`)
    - [x] Add `startEdit(step: Step): void` — sets `editingStepId(step.id)`, patches `editForm` with step values (`name`, `type`, `location ?? ''`, `latitude ?? null`, `longitude ?? null`, `date ?? ''`, `startTime ?? ''`), resets `editFormError`
    - [x] Add `cancelEdit(): void` — sets `editingStepId(null)`, resets `editForm`, clears `editFormError`
    - [x] Add `onEditPlaceSelected(event: PlaceSelectedEvent): void` — patches `editForm` with location/lat/lng (same as `onPlaceSelected`)
    - [x] Add `onEditSubmit(): void` — validates `editForm`, calls `stepService.updateStep`, handles errors same as `onSubmit`; on success: `editingStepId.set(null)`, reset `editForm`
  - [x] In `rollplan-client/src/app/steps/step-list/step-list.component.html`:
    - [x] Add an "Edit" button to each step card (alongside the existing `#{{ step.sortOrder }}` text)
    - [x] Conditionally replace the step card content with the edit form when `editingStepId() === step.id`
    - [x] The edit form mirrors the add form structure: name (required), type (required), location (with `appPlacesAutocomplete`), date, startTime — but submit button reads "Save" and cancel reads "Cancel"

- [x] Task 6: Angular — Unit tests (AC: #1, #2, #3, #4)
  - [x] In `rollplan-client/src/app/steps/step-list/step-list.component.spec.ts`:
    - [x] Add `updateStepSpy` to the mock `StepService` stub
    - [x] Add test: `should show edit form when startEdit is called` — calls `startEdit(mockStep)`, checks `editingStepId()` equals mockStep.id
    - [x] Add test: `should prepopulate edit form with step values` — calls `startEdit(mockStep)`, asserts `editForm.value.name === mockStep.name` and `editForm.value.type === mockStep.type`
    - [x] Add test: `should call updateStep on edit submit with valid form` — calls `startEdit`, sets valid editForm values, calls `onEditSubmit()`, asserts `updateStepSpy` called with correct args
    - [x] Add test: `should hide edit form on cancelEdit` — calls `startEdit`, then `cancelEdit()`, asserts `editingStepId()` is null

## Dev Notes

### What Already Exists — Reuse These Patterns

**Backend:**
- `StepService.AddStepAsync` shows the exact ownership check + entity creation pattern — `UpdateStepAsync` uses the same trip ownership check, then additionally looks up the step
- `StepService.MapToResponse` is already complete for all fields including Latitude/Longitude — reuse as-is
- `TripService.UpdateTripAsync` shows the EF Core update pattern: fetch entity, mutate fields directly, call `SaveChangesAsync()` — **no need for a new EF Core migration** since no schema changes
- `CreateStepRequestValidator` has all the validation rules for step fields — `UpdateStepRequestValidator` is a copy (same rules, different class name referencing `UpdateStepRequest`)
- `StepsController` already has the `GetCurrentUserId()` helper and the `[Authorize]` route prefix — just add a new `[HttpPut("{stepId:guid}")]` action

**Angular:**
- `StepService.addStep` → `updateStep` uses the same HTTP pattern but with `http.put` and updates the signal with `list.map(s => s.id === stepId ? updated : s)`
- `StepListComponent.onSubmit()` → `onEditSubmit()` uses the same error-handling pattern
- `StepListComponent.onPlaceSelected()` → `onEditPlaceSelected()` is identical
- `locationSub` subscription pattern for clearing stale coordinates → `editLocationSub` uses the same `valueChanges` subscription on `editForm.get('location')!`
- `PlacesAutocompleteDirective` is already imported in `StepListComponent` — add it to the edit form's location `<input>` with `(placeSelected)="onEditPlaceSelected($event)"`
- `cancelAdd()` pattern → `cancelEdit()` uses the same reset + signal clear pattern

### Backend: UpdateStepRequest.cs

```csharp
using RollPlan.Api.Models.Entities;

namespace RollPlan.Api.Models.DTOs.Steps;

public class UpdateStepRequest
{
    public string Name { get; set; } = string.Empty;
    public StepType Type { get; set; }
    public string? Location { get; set; }
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public DateOnly? Date { get; set; }
    public string? StartTime { get; set; }
}
```

### Backend: UpdateStepRequestValidator.cs

```csharp
using FluentValidation;
using RollPlan.Api.Models.Entities;

namespace RollPlan.Api.Models.DTOs.Steps;

public class UpdateStepRequestValidator : AbstractValidator<UpdateStepRequest>
{
    public UpdateStepRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Step name is required.")
            .MaximumLength(200).WithMessage("Step name must not exceed 200 characters.");

        RuleFor(x => x.Type)
            .IsInEnum().WithMessage("Step type must be one of: Travel, Accommodation, Activity, Meal, Rest.");

        RuleFor(x => x.Latitude)
            .InclusiveBetween(-90.0, 90.0).When(x => x.Latitude.HasValue)
            .WithMessage("Latitude must be between -90 and 90.")
            .Must((req, _) => req.Longitude.HasValue).When(x => x.Latitude.HasValue)
            .WithMessage("Longitude is required when Latitude is provided.");

        RuleFor(x => x.Longitude)
            .InclusiveBetween(-180.0, 180.0).When(x => x.Longitude.HasValue)
            .WithMessage("Longitude must be between -180 and 180.")
            .Must((req, _) => req.Latitude.HasValue).When(x => x.Longitude.HasValue)
            .WithMessage("Latitude is required when Longitude is provided.");
    }
}
```

### Backend: UpdateStepAsync Implementation

```csharp
public async Task<StepResponse?> UpdateStepAsync(Guid userId, Guid tripId, Guid stepId, UpdateStepRequest request)
{
    var trip = await _dbContext.Trips
        .FirstOrDefaultAsync(t => t.Id == tripId && t.UserId == userId);

    if (trip is null) return null;

    var step = await _dbContext.Steps
        .FirstOrDefaultAsync(s => s.Id == stepId && s.TripId == tripId);

    if (step is null) return null;

    step.Name = request.Name;
    step.Type = request.Type;
    step.Location = request.Location;
    step.Latitude = request.Latitude;
    step.Longitude = request.Longitude;
    step.Date = request.Date;
    step.StartTime = request.StartTime;
    step.UpdatedAt = DateTime.UtcNow;

    await _dbContext.SaveChangesAsync();

    return MapToResponse(step);
}
```

### Backend: StepsController — New Endpoint

Add after `AddStep`:

```csharp
[HttpPut("{stepId:guid}")]
public async Task<IActionResult> UpdateStep(Guid tripId, Guid stepId, [FromBody] UpdateStepRequest request)
{
    var userId = GetCurrentUserId();
    var step = await _stepService.UpdateStepAsync(userId, tripId, stepId, request);
    return step is null ? NotFound() : Ok(step);
}
```

### Angular: UpdateStepRequest Interface and updateStep Method

In `step.service.ts`, add after `CreateStepRequest`:

```typescript
export interface UpdateStepRequest {
  name: string;
  type: StepType;
  location?: string;
  latitude?: number;
  longitude?: number;
  date?: string;
  startTime?: string;
}
```

Add to `StepService` class:

```typescript
updateStep(tripId: string, stepId: string, request: UpdateStepRequest): Observable<Step> {
  return this.http
    .put<Step>(`${API_BASE_URL}/trips/${tripId}/steps/${stepId}`, request)
    .pipe(tap(updated => this._steps.update(list => list.map(s => s.id === stepId ? updated : s))));
}
```

### Angular: StepListComponent TypeScript Changes

**New signals and form (add after existing signals):**

```typescript
editingStepId = signal<string | null>(null);
isEditSubmitting = signal(false);
editFormError = signal<string | null>(null);

private readonly editLocationSub: Subscription;

readonly editForm: FormGroup = this.fb.group({
  name: ['', [Validators.required, Validators.maxLength(200)]],
  type: ['', Validators.required],
  location: [''],
  latitude: [null as number | null],
  longitude: [null as number | null],
  date: [''],
  startTime: ['']
});
```

**In constructor, add alongside existing `locationSub`:**

```typescript
this.editLocationSub = this.editForm.get('location')!.valueChanges.subscribe((val: string | null) => {
  if (!val) {
    this.editForm.patchValue({ latitude: null, longitude: null }, { emitEvent: false });
  }
});
```

**In `ngOnDestroy`, add:**

```typescript
this.editLocationSub.unsubscribe();
```

**New methods:**

```typescript
startEdit(step: Step): void {
  this.editingStepId.set(step.id);
  this.editForm.patchValue({
    name: step.name,
    type: step.type,
    location: step.location ?? '',
    latitude: step.latitude ?? null,
    longitude: step.longitude ?? null,
    date: step.date ?? '',
    startTime: step.startTime ?? ''
  });
  this.editFormError.set(null);
}

cancelEdit(): void {
  this.editingStepId.set(null);
  this.editForm.reset();
  this.editFormError.set(null);
}

onEditPlaceSelected(event: PlaceSelectedEvent): void {
  this.editForm.patchValue({ location: event.name, latitude: event.lat, longitude: event.lng });
}

onEditSubmit(): void {
  if (this.editForm.invalid) {
    this.editForm.markAllAsTouched();
    return;
  }
  if (this.isEditSubmitting()) return;

  this.isEditSubmitting.set(true);
  this.editFormError.set(null);

  const stepId = this.editingStepId()!;
  const { name, type, location, date, startTime, latitude, longitude } = this.editForm.value;

  this.stepService.updateStep(this.tripId, stepId, {
    name,
    type,
    location: location?.trim() || undefined,
    latitude: latitude ?? undefined,
    longitude: longitude ?? undefined,
    date: date || undefined,
    startTime: startTime || undefined
  }).pipe(
    finalize(() => this.isEditSubmitting.set(false))
  ).subscribe({
    next: () => {
      this.editingStepId.set(null);
      this.editForm.reset();
    },
    error: (err) => {
      const errors = err.error?.errors as Record<string, string[]> | undefined;
      if (errors) {
        const nameErrors: string[] = errors['Name'] ?? errors['name'] ?? [];
        if (nameErrors.length > 0) {
          this.editForm.get('name')!.setErrors({ serverError: nameErrors[0] });
        }
        const other = Object.entries(errors)
          .filter(([k]) => k.toLowerCase() !== 'name')
          .flatMap(([, msgs]) => msgs)[0];
        this.editFormError.set(other ?? null);
      } else {
        this.editFormError.set(err.error?.detail ?? 'Failed to update step.');
      }
    }
  });
}
```

### Angular: StepListComponent HTML Changes

**Step card — add edit button and inline edit form.**

Replace the current step card block (the `*ngFor` div) with this pattern:

```html
<div
  *ngFor="let step of steps()"
  class="rounded-2xl bg-slate-900/60 p-4 ring-1 ring-white/10"
>
  <!-- VIEW MODE -->
  <ng-container *ngIf="editingStepId() !== step.id">
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-2 flex-wrap">
          <span class="text-sm font-semibold text-white">{{ step.name }}</span>
          <span [class]="'shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ' + typeBadgeClass(step.type)">
            {{ step.type }}
          </span>
        </div>
        <div *ngIf="step.location || step.date || step.startTime" class="mt-1.5 flex flex-wrap gap-3 text-xs text-slate-400">
          <span *ngIf="step.location">📍 {{ step.location }}</span>
          <span *ngIf="step.date">📅 {{ step.date }}</span>
          <span *ngIf="step.startTime">🕐 {{ step.startTime }}</span>
        </div>
      </div>
      <div class="flex items-center gap-2 shrink-0">
        <button
          type="button"
          (click)="startEdit(step)"
          class="text-xs text-slate-400 hover:text-sky-400 transition"
        >Edit</button>
        <span class="text-xs text-slate-600">#{{ step.sortOrder }}</span>
      </div>
    </div>
  </ng-container>

  <!-- EDIT MODE -->
  <ng-container *ngIf="editingStepId() === step.id">
    <h3 class="mb-4 text-sm font-semibold text-white">Edit Step</h3>

    <div *ngIf="editFormError()" class="mb-4 rounded-2xl bg-red-50/90 border border-red-200 p-3 text-sm text-red-700">
      {{ editFormError() }}
    </div>

    <form [formGroup]="editForm" (ngSubmit)="onEditSubmit()" class="space-y-4" novalidate>

      <div>
        <label class="block text-sm font-semibold text-slate-200 mb-1.5">Name <span class="text-red-400">*</span></label>
        <input
          type="text"
          formControlName="name"
          class="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-slate-100 transition focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/25"
          [class.border-red-500]="editForm.get('name')!.invalid && editForm.get('name')!.touched"
        />
        <p *ngIf="editForm.get('name')!.touched && editForm.get('name')!.hasError('required')" class="mt-1.5 text-xs text-red-400">
          Step name is required.
        </p>
        <p *ngIf="editForm.get('name')!.hasError('serverError')" class="mt-1.5 text-xs text-red-400">
          {{ editForm.get('name')!.getError('serverError') }}
        </p>
      </div>

      <div>
        <label class="block text-sm font-semibold text-slate-200 mb-1.5">Type <span class="text-red-400">*</span></label>
        <select
          formControlName="type"
          class="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-slate-100 transition focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/25"
          [class.border-red-500]="editForm.get('type')!.invalid && editForm.get('type')!.touched"
        >
          <option value="" disabled>Select a type</option>
          <option *ngFor="let t of stepTypes" [value]="t">{{ t }}</option>
        </select>
        <p *ngIf="editForm.get('type')!.touched && editForm.get('type')!.hasError('required')" class="mt-1.5 text-xs text-red-400">
          Step type is required.
        </p>
      </div>

      <div>
        <label class="block text-sm font-semibold text-slate-200 mb-1.5">Location</label>
        <input
          type="text"
          formControlName="location"
          appPlacesAutocomplete
          (placeSelected)="onEditPlaceSelected($event)"
          class="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-slate-100 transition focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/25"
        />
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-semibold text-slate-200 mb-1.5">Date</label>
          <input
            type="date"
            formControlName="date"
            class="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-slate-100 transition focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/25"
          />
        </div>
        <div>
          <label class="block text-sm font-semibold text-slate-200 mb-1.5">Time</label>
          <input
            type="time"
            formControlName="startTime"
            class="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-slate-100 transition focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/25"
          />
        </div>
      </div>

      <div class="flex gap-3 pt-1">
        <button
          type="submit"
          [disabled]="isEditSubmitting()"
          class="inline-flex items-center justify-center rounded-2xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span *ngIf="isEditSubmitting(); else saveLabel">Saving…</span>
          <ng-template #saveLabel>Save</ng-template>
        </button>
        <button
          type="button"
          (click)="cancelEdit()"
          class="inline-flex items-center justify-center rounded-2xl border border-slate-700 px-5 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-slate-800"
        >
          Cancel
        </button>
      </div>

    </form>
  </ng-container>
</div>
```

### Angular Unit Test Additions

In `step-list.component.spec.ts`, add `updateStepSpy` to the stub and four new tests:

```typescript
// in beforeEach stub:
updateStepSpy = vi.fn();
const stepServiceStub = {
  steps: stepsSignal.asReadonly(),
  getSteps: getStepsSpy,
  addStep: addStepSpy,
  updateStep: updateStepSpy
};

// new tests:
it('should show edit form when startEdit is called', () => {
  getStepsSpy.mockReturnValue(of([mockStep]));
  const fixture = TestBed.createComponent(StepListComponent);
  fixture.componentInstance.tripId = '11111111-1111-1111-1111-111111111111';
  stepsSignal.set([mockStep]);
  fixture.detectChanges();

  fixture.componentInstance.startEdit(mockStep);
  expect(fixture.componentInstance.editingStepId()).toBe(mockStep.id);
});

it('should prepopulate edit form with step values', () => {
  getStepsSpy.mockReturnValue(of([mockStep]));
  const fixture = TestBed.createComponent(StepListComponent);
  fixture.componentInstance.tripId = '11111111-1111-1111-1111-111111111111';
  fixture.detectChanges();

  fixture.componentInstance.startEdit(mockStep);
  expect(fixture.componentInstance.editForm.value.name).toBe('Ferry Crossing');
  expect(fixture.componentInstance.editForm.value.type).toBe('Travel');
});

it('should call updateStep on edit submit with valid form', () => {
  getStepsSpy.mockReturnValue(of([mockStep]));
  updateStepSpy.mockReturnValue(of({ ...mockStep, name: 'Updated Step' }));
  const fixture = TestBed.createComponent(StepListComponent);
  fixture.componentInstance.tripId = '11111111-1111-1111-1111-111111111111';
  fixture.detectChanges();

  fixture.componentInstance.startEdit(mockStep);
  fixture.componentInstance.editForm.patchValue({ name: 'Updated Step', type: 'Travel' });
  fixture.componentInstance.onEditSubmit();

  expect(updateStepSpy).toHaveBeenCalledWith(
    '11111111-1111-1111-1111-111111111111',
    mockStep.id,
    expect.objectContaining({ name: 'Updated Step', type: 'Travel' })
  );
});

it('should hide edit form on cancelEdit', () => {
  getStepsSpy.mockReturnValue(of([mockStep]));
  const fixture = TestBed.createComponent(StepListComponent);
  fixture.componentInstance.tripId = '11111111-1111-1111-1111-111111111111';
  fixture.detectChanges();

  fixture.componentInstance.startEdit(mockStep);
  fixture.componentInstance.cancelEdit();
  expect(fixture.componentInstance.editingStepId()).toBeNull();
});
```

### No Migration Needed

The `steps` table already has all required columns (`latitude`, `longitude`, `location`, `date`, `start_time`, etc.) from previous migrations. Story 3.3 only adds an update endpoint — no schema changes.

### No New npm Packages

All dependencies already installed. `PlacesAutocompleteDirective` is already imported in `StepListComponent`.

### API

New endpoint:
- `PUT /api/v1/trips/{tripId}/steps/{stepId}` — JWT required, replaces all mutable fields of the step, returns `StepResponse`, 404 if trip not owned or step not found

### Key Constraints from Previous Stories

- `StepType` is an enum — the edit form uses the same `stepTypes: StepType[]` array already defined in `StepListComponent`
- `DateOnly?` on the backend: Angular sends a plain string `'YYYY-MM-DD'` from `<input type="date">` which .NET deserializes correctly to `DateOnly?`
- `StartTime` is still a plain string (no server-side format validation beyond implicit `null`/`undefined` check) — see deferred work from Story 3.1 review
- `SortOrder` is NOT updated by the edit endpoint — it is managed by Story 3.5 (Reorder Steps)
- `Note` is NOT editable in this story — it belongs to Epic 5 (Moment Cards)
- `CreatedAt` is never updated on edits — only `UpdatedAt`

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### File List

- `rollplan-api/Models/DTOs/Steps/UpdateStepRequest.cs` (new)
- `rollplan-api/Models/DTOs/Steps/UpdateStepRequestValidator.cs` (new)
- `rollplan-api/Services/IStepService.cs` (modified)
- `rollplan-api/Services/StepService.cs` (modified)
- `rollplan-api/Controllers/StepsController.cs` (modified)
- `rollplan-api-tests/Services/StepServiceTests.cs` (modified)
- `rollplan-client/src/app/steps/services/step.service.ts` (modified)
- `rollplan-client/src/app/steps/step-list/step-list.component.ts` (modified)
- `rollplan-client/src/app/steps/step-list/step-list.component.html` (modified)
- `rollplan-client/src/app/steps/step-list/step-list.component.spec.ts` (modified)

### Change Log

- Implemented Story 3.3: added PUT /api/v1/trips/{tripId}/steps/{stepId} endpoint with UpdateStepRequest DTO + validator (same field rules as Create), UpdateStepAsync in StepService, updateStep in Angular StepService, and inline edit mode in StepListComponent (editingStepId signal, editForm, startEdit/cancelEdit/onEditSubmit methods, Edit button per step card, Places autocomplete on edit location field). 102 Angular tests pass (17 files). (Date: 2026-05-10)

### Review Findings

- [x] [Review][Patch] `onEditSubmit` non-null assertion `editingStepId()!` without null guard — if called with no step in edit mode, throws runtime error [step-list.component.ts:137]

- [x] [Review][Defer] FluentValidation `.WithMessage` chaining after `.Must()` [UpdateStepRequestValidator.cs:19] — deferred, pre-existing (same pattern as CreateStepRequestValidator reviewed in story 3.2)
- [x] [Review][Defer] Controller conflates trip-not-owned and step-not-found into same 404 [StepsController.cs] — deferred, pre-existing design decision consistent across codebase
- [x] [Review][Defer] `StepType` default 0 silently accepted when `type` omitted from JSON body [UpdateStepRequest.cs:4] — deferred, pre-existing same as CreateStepRequest
- [x] [Review][Defer] `UpdatedAt` mutated on entity before `SaveChangesAsync` — in-memory state inconsistent if exception thrown [StepService.cs] — deferred, pre-existing
- [x] [Review][Defer] Validator error messages hardcode StepType enum values [UpdateStepRequestValidator.cs:14] — deferred, pre-existing same as CreateStepRequestValidator
- [x] [Review][Defer] Other-field validation errors collapsed to single banner with no per-field feedback [step-list.component.html] — deferred, pre-existing UX pattern
- [x] [Review][Defer] `CreateStepRequest`/`UpdateStepRequest` TypeScript interfaces are duplicated [step.service.ts] — deferred, refactoring suggestion not a defect
- [x] [Review][Defer] `SaveChangesAsync` `DbUpdateException` propagates as unhandled 500 [StepService.cs] — deferred, global exception handler concern pre-existing across all services
