# Story 5.1: Add, Edit, and Remove Note on a Step

Status: review

## Story

As an **authenticated user**,
I want to add, edit, or remove a text note on a step,
so that I can capture context and memories for each stop.

## Acceptance Criteria

1. **Given** an authenticated user viewing a step
   **When** they open the edit form for that step, add note text, and save
   **Then** the note is stored and displayed on the step card

2. **Given** a step with an existing note
   **When** the user opens edit, changes the note text, and saves
   **Then** the updated note text is stored and displayed

3. **Given** a step with an existing note
   **When** the user opens edit, clears the note textarea, and saves
   **Then** the note is removed (step.note is null); the note display disappears

4. **Given** a step with or without a note
   **When** the step is rendered in view mode
   **Then** the note text is shown below the date/time line if present, hidden if absent

5. **Given** a note that exceeds 2000 characters
   **When** the user submits the form
   **Then** the server returns a 400 with a validation error and the note is not saved

## Tasks / Subtasks

- [x] Task 1: Add `Note` to backend request DTOs and validators (AC: #1, #2, #3, #5)
  - [x] In `CreateStepRequest.cs`: add `public string? Note { get; set; }`
  - [x] In `UpdateStepRequest.cs`: add `public string? Note { get; set; }`
  - [x] In `CreateStepRequestValidator.cs`: add `RuleFor(x => x.Note).MaximumLength(2000).WithMessage("Note must not exceed 2000 characters.");`
  - [x] In `UpdateStepRequestValidator.cs`: add the same rule

- [x] Task 2: Wire `Note` in `StepService` (AC: #1, #2, #3)
  - [x] In `AddStepAsync`: add `Note = string.IsNullOrWhiteSpace(request.Note) ? null : request.Note` to the `new Step { ... }` initializer
  - [x] In `UpdateStepAsync`: add `step.Note = string.IsNullOrWhiteSpace(request.Note) ? null : request.Note;` after the existing field assignments

- [x] Task 3: Add backend tests (AC: #1, #2, #3, #5)
  - [x] `AddStepAsync_StoresNote_WhenProvided` — request with `Note = "Great view"`, assert `result.Note == "Great view"`
  - [x] `AddStepAsync_StoresNullNote_WhenNoteIsEmpty` — request with `Note = ""`, assert `result.Note == null`
  - [x] `UpdateStepAsync_UpdatesNote_WhenProvided` — seed step with null note, update with `Note = "Added later"`, assert `result.Note == "Added later"`
  - [x] `UpdateStepAsync_ClearsNote_WhenNoteIsEmpty` — seed step with `Note = "Old note"`, update with `Note = ""`, assert `result.Note == null`

- [x] Task 4: Update frontend TypeScript interfaces (AC: #1, #2, #3)
  - [x] In `step.service.ts`: add `note?: string` to `CreateStepRequest` interface
  - [x] In `step.service.ts`: add `note?: string` to `UpdateStepRequest` interface

- [x] Task 5: Add `note` form controls and wire submission (AC: #1, #2, #3)
  - [x] In `step-list.component.ts`, add `note: ['']` to `form` FormGroup (after `startTime`)
  - [x] In `step-list.component.ts`, add `note: ['']` to `editForm` FormGroup (after `startTime`)
  - [x] In `startEdit()`: add `note: step.note ?? ''` to the `patchValue()` call
  - [x] In `onSubmit()`: destructure `note` from `this.form.value` and pass `note: note?.trim() || undefined` to `addStep()`
  - [x] In `onEditSubmit()`: destructure `note` from `this.editForm.value` and pass `note: note?.trim() || undefined` to `updateStep()`

- [x] Task 6: Update the template (AC: #1, #2, #3, #4)
  - [x] In the **edit form** (`editForm` section, after the date/time grid, before the submit buttons): add a note textarea
  - [x] In the **add form** (`form` section, after the date/time grid, before the submit buttons): add a note textarea
  - [x] In **view mode** (below the `<div *ngIf="step.location || step.date || step.startTime"...>` line): add `<p *ngIf="step.note" class="mt-2 text-sm text-slate-300 whitespace-pre-wrap">{{ step.note }}</p>`

- [x] Task 7: Add frontend tests (AC: #1, #2, #3, #4)
  - [x] `should include note in addStep call when note is provided` — patch form with `note: 'Great view'`, call `onSubmit()`, assert `addStepSpy` called with `expect.objectContaining({ note: 'Great view' })`
  - [x] `should prepopulate note in edit form when step has note` — call `startEdit(stepWithNote)`, assert `editForm.value.note === 'Existing note'`
  - [x] `should include note in updateStep call` — startEdit, patchValue `note: 'Updated'`, call `onEditSubmit()`, assert `updateStepSpy` called with `expect.objectContaining({ note: 'Updated' })`
  - [x] `should pass undefined note when note field is empty on submit` — patch form `note: ''`, call `onSubmit()`, assert `addStepSpy` called with `expect.objectContaining({ note: undefined })`

## Dev Notes

### No Migration Required

`Step.Note` (nullable `string?`) already exists on the `Step` entity (`rollplan-api/Models/Entities/Step.cs:14`) and the column is already in the database. `StepResponse` already returns it (`rollplan-api/Models/DTOs/Steps/StepResponse.cs:17`). The frontend `Step` interface already includes `note?: string` (`step.service.ts:20`). **Do not create a migration.**

### Backend: Exact Changes

**`rollplan-api/Models/DTOs/Steps/CreateStepRequest.cs`** — add after `StartTime`:
```csharp
public string? Note { get; set; }
```

**`rollplan-api/Models/DTOs/Steps/UpdateStepRequest.cs`** — add after `StartTime`:
```csharp
public string? Note { get; set; }
```

**`rollplan-api/Models/DTOs/Steps/CreateStepRequestValidator.cs`** — add to constructor body:
```csharp
RuleFor(x => x.Note)
    .MaximumLength(2000).WithMessage("Note must not exceed 2000 characters.");
```

**`rollplan-api/Models/DTOs/Steps/UpdateStepRequestValidator.cs`** — same rule.

**`rollplan-api/Services/StepService.cs` — `AddStepAsync`** — add to `new Step { ... }` initializer at line 44–58:
```csharp
Note = string.IsNullOrWhiteSpace(request.Note) ? null : request.Note,
```

**`rollplan-api/Services/StepService.cs` — `UpdateStepAsync`** — add after `step.StartTime = request.StartTime;` (line 84):
```csharp
step.Note = string.IsNullOrWhiteSpace(request.Note) ? null : request.Note;
```

### Backend: Note Normalization Rule

Both add and update must normalize: empty string → `null`. The client sends `note?: string` — an absent or empty field becomes `null` in the database. This satisfies AC #3 ("clearing the note removes it").

### Frontend: `step.service.ts` Interfaces

Add `note?: string` to both `CreateStepRequest` (line ~33) and `UpdateStepRequest` (line ~43). The `Step` interface already has it at line 20 — **do not duplicate it**.

### Frontend: Form Controls

Both `form` and `editForm` in `step-list.component.ts` need a `note` control. The control value is plain text — no validators needed (max-length enforcement is server-side only). Patch pattern in `startEdit()` already used for all optional fields:

```typescript
// In startEdit():
this.editForm.patchValue({
  name: step.name,
  type: step.type,
  location: step.location ?? '',
  latitude: step.latitude ?? null,
  longitude: step.longitude ?? null,
  date: step.date ?? '',
  startTime: step.startTime ?? '',
  note: step.note ?? ''          // ADD THIS
});
```

### Frontend: Submission Value Extraction

In `onSubmit()` and `onEditSubmit()`, the note is extracted and normalized:

```typescript
// onSubmit:
const { name, type, location, date, startTime, latitude, longitude, note } = this.form.value;
// ...
this.stepService.addStep(this.tripId, {
  // ... existing fields ...
  note: note?.trim() || undefined   // undefined = field omitted from JSON body
});

// onEditSubmit:
const { name, type, location, date, startTime, latitude, longitude, note } = this.editForm.value;
// ...
this.stepService.updateStep(this.tripId, stepId, {
  // ... existing fields ...
  note: note?.trim() || undefined
});
```

`undefined` causes the field to be omitted from the JSON body, which the C# serializer treats as `null` on the DTO — the backend normalizes empty/null to `null` on the entity.

### Frontend: Template — Note Textarea

Use the same styling pattern as the existing date/time grid inputs. Add to **both** the edit form and add form, after the date/time `<div class="grid grid-cols-2 gap-4">` block and before the submit button `<div class="flex gap-3 ...">`:

```html
<div>
  <label class="block text-sm font-semibold text-slate-200 mb-1.5">Note</label>
  <textarea
    formControlName="note"
    rows="3"
    placeholder="Add a note for this step…"
    class="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-slate-100 transition focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/25 resize-none"
  ></textarea>
</div>
```

### Frontend: Template — Note Display in View Mode

In view mode, the existing date/time line is:
```html
<div *ngIf="step.location || step.date || step.startTime" class="mt-1.5 flex flex-wrap gap-3 text-xs text-slate-400">
  ...
</div>
```

Add the note display **immediately after** this `<div>`:
```html
<p *ngIf="step.note" class="mt-2 text-sm text-slate-300 whitespace-pre-wrap">{{ step.note }}</p>
```

`whitespace-pre-wrap` preserves newlines the user may have typed. No Markdown rendering — plain text only per AC #4.

### Backend Tests: Exact Pattern

Follow the existing `StepServiceTests.cs` pattern — `IDisposable`, in-memory EF, `SeedTrip()`, `SeedStep()`. New tests for Note go after the existing `AddStepAsync_StoresNullCoordinates_WhenNotProvided` test:

```csharp
[Fact]
public async Task AddStepAsync_StoresNote_WhenProvided()
{
    var trip = SeedTrip();
    var request = new CreateStepRequest { Name = "Café Stop", Type = StepType.Activity, Note = "Best croissants ever" };
    var result = await _service.AddStepAsync(_userId, trip.Id, request);
    Assert.Equal("Best croissants ever", result!.Note);
}

[Fact]
public async Task AddStepAsync_StoresNullNote_WhenNoteIsEmpty()
{
    var trip = SeedTrip();
    var request = new CreateStepRequest { Name = "Café Stop", Type = StepType.Activity, Note = "" };
    var result = await _service.AddStepAsync(_userId, trip.Id, request);
    Assert.Null(result!.Note);
}

[Fact]
public async Task UpdateStepAsync_UpdatesNote_WhenProvided()
{
    var trip = SeedTrip();
    var step = SeedStep(trip.Id, 1);
    var request = new UpdateStepRequest { Name = step.Name, Type = step.Type, Note = "Added later" };
    var result = await _service.UpdateStepAsync(_userId, trip.Id, step.Id, request);
    Assert.Equal("Added later", result!.Note);
}

[Fact]
public async Task UpdateStepAsync_ClearsNote_WhenNoteIsEmpty()
{
    var trip = SeedTrip();
    var step = SeedStep(trip.Id, 1);
    step.Note = "Old note";
    await _dbContext.SaveChangesAsync();
    var request = new UpdateStepRequest { Name = step.Name, Type = step.Type, Note = "" };
    var result = await _service.UpdateStepAsync(_userId, trip.Id, step.Id, request);
    Assert.Null(result!.Note);
}
```

### Frontend Tests: Exact Pattern

Add `mockStepWithNote` fixture (used only in these tests) and 4 new tests after the existing reorder tests. The `mockStep` fixture does NOT have a `note` field — do not modify it.

```typescript
const mockStepWithNote: Step = {
  ...mockStep,
  note: 'Existing note text'
};
```

```typescript
it('should include note in addStep call when note is provided', () => {
  getStepsSpy.mockReturnValue(of([]));
  addStepSpy.mockReturnValue(of(mockStep));
  const fixture = TestBed.createComponent(StepListComponent);
  fixture.componentInstance.tripId = '11111111-1111-1111-1111-111111111111';
  fixture.detectChanges();
  fixture.componentInstance.showAddForm.set(true);
  fixture.componentInstance.form.patchValue({ name: 'Café Stop', type: 'Activity', note: 'Great view' });
  fixture.componentInstance.onSubmit();
  expect(addStepSpy).toHaveBeenCalledWith(
    '11111111-1111-1111-1111-111111111111',
    expect.objectContaining({ note: 'Great view' })
  );
});

it('should prepopulate note in edit form when step has note', () => {
  getStepsSpy.mockReturnValue(of([mockStepWithNote]));
  const fixture = TestBed.createComponent(StepListComponent);
  fixture.componentInstance.tripId = '11111111-1111-1111-1111-111111111111';
  fixture.detectChanges();
  fixture.componentInstance.startEdit(mockStepWithNote);
  expect(fixture.componentInstance.editForm.value.note).toBe('Existing note text');
});

it('should include note in updateStep call', () => {
  getStepsSpy.mockReturnValue(of([mockStepWithNote]));
  updateStepSpy.mockReturnValue(of({ ...mockStepWithNote, note: 'Updated note' }));
  const fixture = TestBed.createComponent(StepListComponent);
  fixture.componentInstance.tripId = '11111111-1111-1111-1111-111111111111';
  fixture.detectChanges();
  fixture.componentInstance.startEdit(mockStepWithNote);
  fixture.componentInstance.editForm.patchValue({ note: 'Updated note' });
  fixture.componentInstance.onEditSubmit();
  expect(updateStepSpy).toHaveBeenCalledWith(
    '11111111-1111-1111-1111-111111111111',
    mockStepWithNote.id,
    expect.objectContaining({ note: 'Updated note' })
  );
});

it('should pass undefined note when note field is empty on submit', () => {
  getStepsSpy.mockReturnValue(of([]));
  addStepSpy.mockReturnValue(of(mockStep));
  const fixture = TestBed.createComponent(StepListComponent);
  fixture.componentInstance.tripId = '11111111-1111-1111-1111-111111111111';
  fixture.detectChanges();
  fixture.componentInstance.showAddForm.set(true);
  fixture.componentInstance.form.patchValue({ name: 'Plain Step', type: 'Activity', note: '' });
  fixture.componentInstance.onSubmit();
  expect(addStepSpy).toHaveBeenCalledWith(
    '11111111-1111-1111-1111-111111111111',
    expect.objectContaining({ note: undefined })
  );
});
```

### File List

- `rollplan-api/Models/DTOs/Steps/CreateStepRequest.cs` (add `Note`)
- `rollplan-api/Models/DTOs/Steps/UpdateStepRequest.cs` (add `Note`)
- `rollplan-api/Models/DTOs/Steps/CreateStepRequestValidator.cs` (add MaximumLength rule)
- `rollplan-api/Models/DTOs/Steps/UpdateStepRequestValidator.cs` (add MaximumLength rule)
- `rollplan-api/Services/StepService.cs` (wire Note in AddStepAsync and UpdateStepAsync)
- `rollplan-api-tests/Services/StepServiceTests.cs` (4 new tests)
- `rollplan-client/src/app/steps/services/step.service.ts` (add note to request interfaces)
- `rollplan-client/src/app/steps/step-list/step-list.component.ts` (note controls, patch, submit)
- `rollplan-client/src/app/steps/step-list/step-list.component.html` (note textarea + view display)
- `rollplan-client/src/app/steps/step-list/step-list.component.spec.ts` (4 new tests)

### Anti-Patterns to Avoid

- **Do NOT create a migration** — the `Note` column exists; a new migration will fail or create a duplicate
- **Do NOT add a separate `NoteComponent`** — all note functionality lives inside `StepListComponent`
- **Do NOT add `Validators.maxLength(2000)` client-side** — max length is server-enforced only; keep client forms simple
- **Do NOT use `[hidden]` or `*ngIf` to toggle note display** — just use `*ngIf="step.note"` for the view-mode paragraph
- **Do NOT add Markdown rendering** — plain text only per AC #5

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### File List

- `rollplan-api/Models/DTOs/Steps/CreateStepRequest.cs`
- `rollplan-api/Models/DTOs/Steps/UpdateStepRequest.cs`
- `rollplan-api/Models/DTOs/Steps/CreateStepRequestValidator.cs`
- `rollplan-api/Models/DTOs/Steps/UpdateStepRequestValidator.cs`
- `rollplan-api/Services/StepService.cs`
- `rollplan-api-tests/Services/StepServiceTests.cs`
- `rollplan-client/src/app/steps/services/step.service.ts`
- `rollplan-client/src/app/steps/step-list/step-list.component.ts`
- `rollplan-client/src/app/steps/step-list/step-list.component.html`
- `rollplan-client/src/app/steps/step-list/step-list.component.spec.ts`

### Completion Notes List

- Added `Note string?` to `CreateStepRequest` and `UpdateStepRequest` DTOs; added `MaximumLength(2000)` FluentValidation rules to both validators
- Wired `Note` in `StepService.AddStepAsync` and `UpdateStepAsync` with empty→null normalization (`IsNullOrWhiteSpace` → null)
- Added 4 xUnit backend tests covering note store, empty→null normalization, update, and clear; .NET runtime unavailable in dev environment — tests verified by code review
- Added `note?: string` to both TypeScript request interfaces in `step.service.ts`
- Added `note: ['']` form control to both `form` and `editForm`; wired `startEdit()` patch, `onSubmit()`, and `onEditSubmit()` with `note?.trim() || undefined` normalization
- Added note textarea to both add form and edit form in template; added `<p *ngIf="step.note">` display in view mode with `whitespace-pre-wrap`
- Added 4 frontend Vitest tests; all 125 Angular tests pass (was 121)

### Debug Log References
