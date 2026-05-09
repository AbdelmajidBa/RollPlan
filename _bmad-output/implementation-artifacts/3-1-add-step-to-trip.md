# Story 3.1: Add Step to Trip

Status: ready-for-dev

## Story

As an **authenticated user**,
I want to add a step to a trip with a name, type, location, date, and time,
So that I can build a complete itinerary.

## Acceptance Criteria

1. **Given** an authenticated user on the trip detail page
   **When** they submit the add step form with required fields
   **Then** a new step is created and appended to the trip's step list
   **And** step type must be one of: Travel, Accommodation, Activity, Meal, Rest
   **And** location, date, and time are optional
   **And** the step name is required
   **And** invalid input shows inline validation errors

## Tasks / Subtasks

- [ ] Task 1: Backend — Step entity + StepType enum + AppDbContext + Migration (AC: #1)
  - [ ] Create `rollplan-api/Models/Entities/StepType.cs`: `public enum StepType { Travel, Accommodation, Activity, Meal, Rest }`
  - [ ] Create `rollplan-api/Models/Entities/Step.cs`: `Id` (Guid), `Name` (string), `Type` (StepType), `Location` (string?), `Date` (DateOnly?), `StartTime` (string?), `SortOrder` (int), `Note` (string?), `CreatedAt` (DateTime), `UpdatedAt` (DateTime), `TripId` (Guid FK), `Trip` (nav prop)
  - [ ] Add `public DbSet<Step> Steps => Set<Step>();` to `AppDbContext`; remove "Step, Photo DbSets added in Epics 3–5" comment
  - [ ] Add Step entity config in `AppDbContext.OnModelCreating`: `Name.HasMaxLength(200)`, `Type.HasConversion<string>()`, FK to Trip with `OnDelete(DeleteBehavior.Cascade)`
  - [ ] Create migration `rollplan-api/Migrations/20260509000003_AddStepsTable.cs` — see Dev Notes for column specs
  - [ ] Create `rollplan-api/Migrations/20260509000003_AddStepsTable.Designer.cs` — full model snapshot including Step entity
  - [ ] Update `rollplan-api/Migrations/AppDbContextModelSnapshot.cs` — add Step entity and relationship blocks

- [ ] Task 2: Backend — DTOs + Validator (AC: #1)
  - [ ] Create `rollplan-api/Models/DTOs/Steps/CreateStepRequest.cs`: `Name` (string), `Type` (StepType), `Location` (string?), `Date` (DateOnly?), `StartTime` (string?)
  - [ ] Create `rollplan-api/Models/DTOs/Steps/CreateStepRequestValidator.cs`: Name required + max 200; Type must be valid enum value
  - [ ] Create `rollplan-api/Models/DTOs/Steps/StepResponse.cs`: `Id`, `TripId`, `Name`, `Type`, `Location?`, `Date?`, `StartTime?`, `SortOrder`, `Note?`, `CreatedAt`, `UpdatedAt`

- [ ] Task 3: Backend — IStepService + StepService + StepsController (AC: #1)
  - [ ] Create `rollplan-api/Services/IStepService.cs`: `Task<IEnumerable<StepResponse>?> GetStepsAsync(Guid userId, Guid tripId)` and `Task<StepResponse?> AddStepAsync(Guid userId, Guid tripId, CreateStepRequest request)`
  - [ ] Create `rollplan-api/Services/StepService.cs`: inject `AppDbContext`; `GetStepsAsync` — verify trip ownership (null if not found/wrong owner), return steps ordered by SortOrder; `AddStepAsync` — verify ownership, compute `maxOrder + 1`, create step, save, return mapped response
  - [ ] Register `StepService` in DI: add `builder.Services.AddScoped<IStepService, StepService>();` in `Program.cs`
  - [ ] Create `rollplan-api/Controllers/StepsController.cs`: route `[Route("api/v1/trips/{tripId:guid}/steps")]`, `[Authorize]`; `GetSteps(Guid tripId)` → `Ok(steps)` or `NotFound()`; `AddStep(Guid tripId, [FromBody] CreateStepRequest request)` → `StatusCode(201, step)` or `NotFound()`

- [ ] Task 4: Backend — Unit tests (AC: #1)
  - [ ] Create `rollplan-api-tests/Services/StepServiceTests.cs` following existing pattern (InMemoryDatabase, `IDisposable`)
  - [ ] `GetStepsAsync_ReturnsSteps_WhenOwned` — seed trip + 2 steps, assert ordered by SortOrder
  - [ ] `GetStepsAsync_ReturnsNull_WhenTripNotOwned` — other user's trip, assert null
  - [ ] `AddStepAsync_CreatesStep_WhenOwned` — seed trip, add step, verify in DB + response fields
  - [ ] `AddStepAsync_ReturnsNull_WhenTripNotOwned` — other user's trip, assert null + DB unchanged
  - [ ] `AddStepAsync_SetsCorrectSortOrder` — seed trip with 2 existing steps, add third, assert SortOrder = 3

- [ ] Task 5: Angular — StepService + interfaces (AC: #1)
  - [ ] Create `rollplan-client/src/app/steps/services/step.service.ts`:
    - Export `StepType = 'Travel' | 'Accommodation' | 'Activity' | 'Meal' | 'Rest'`
    - Export `Step` interface: `id`, `tripId`, `name`, `type: StepType`, `location?`, `date?`, `startTime?`, `sortOrder`, `note?`, `createdAt`, `updatedAt`
    - Export `CreateStepRequest` interface: `name`, `type: StepType`, `location?`, `date?`, `startTime?`
    - `StepService` with `_steps = signal<Step[]>([])`, readonly `steps`, `getSteps(tripId)`, `addStep(tripId, request)`
    - `getSteps`: `GET ${API_BASE_URL}/trips/${tripId}/steps`, `tap(steps => this._steps.set(steps))`
    - `addStep`: `POST ${API_BASE_URL}/trips/${tripId}/steps` with JSON body, `tap(step => this._steps.update(list => [...list, step]))`

- [ ] Task 6: Angular — StepListComponent + TripDetailComponent integration (AC: #1)
  - [ ] Create `rollplan-client/src/app/steps/step-list/step-list.component.ts`:
    - `@Input() tripId!: string`; inject `StepService`, `FormBuilder`
    - Signals: `isLoading = signal(true)`, `showAddForm = signal(false)`, `isSubmitting = signal(false)`, `formError = signal<string | null>(null)`
    - `readonly steps = this.stepService.steps`
    - `readonly stepTypes: StepType[] = ['Travel', 'Accommodation', 'Activity', 'Meal', 'Rest']`
    - Reactive form: `name` (required), `type` (required), `location`, `date`, `startTime`
    - `ngOnInit`: call `getSteps(tripId).subscribe({ next: () => ..., error: () => ... })`, set `isLoading(false)` in both
    - `onSubmit()`: validate, call `addStep`, reset form + `showAddForm(false)` on success; `finalize()` resets `isSubmitting`
  - [ ] Create `rollplan-client/src/app/steps/step-list/step-list.component.html`: loading spinner, steps list (name, type badge, location/date/time if set), empty state ("No steps yet"), "Add Step" button toggling inline form, inline form with name/type/location/date/startTime fields, Save/Cancel
  - [ ] In `TripDetailComponent`: remove `private` from `tripId` field; add `StepListComponent` to `imports[]`; add `<app-step-list [tripId]="tripId">` at bottom of trip view (outside edit form, inside the `*ngIf="!isLoading() && trip()"` block)

- [ ] Task 7: Angular — Unit tests (AC: #1)
  - [ ] Create `rollplan-client/src/app/steps/services/step.service.spec.ts`:
    - `addStep should POST /trips/:tripId/steps with JSON body`
    - `addStep should append step to _steps signal`
    - `getSteps should GET /trips/:tripId/steps`
    - `getSteps should populate _steps signal`
  - [ ] Create `rollplan-client/src/app/steps/step-list/step-list.component.spec.ts`:
    - Stub `StepService` with `vi.fn()` + `signal<Step[]>([])`
    - `should create`
    - `should call getSteps on init`
    - `should show add form when showAddForm is true`
    - `should hide add form when cancel clicked`

## Dev Notes

### What Already Exists — Reuse These Patterns

- `TripsController.GetCurrentUserId()` — same pattern needed in `StepsController` (copy verbatim from `rollplan-api/Controllers/TripsController.cs`)
- `TripService.AddTripAsync` ownership check: `_dbContext.Trips.FirstOrDefaultAsync(t => t.Id == tripId && t.UserId == userId)` — same pattern for StepService
- `FluentValidation` auto-registered in `Program.cs` via `AddFluentValidationAutoValidation()` — validator will be picked up automatically, no registration needed
- Migration manual creation pattern: study `20260509000002_AddTripDates.cs` and its `.Designer.cs` and the `AppDbContextModelSnapshot.cs` for exact format
- `inject()` DI pattern in Angular components: `private readonly fb = inject(FormBuilder)` — use for StepListComponent
- `finalize()` from `rxjs/operators` for resetting submitting flags — reuse from TripDetailComponent
- Vitest stub pattern: `{ provide: StepService, useValue: { getSteps: vi.fn(), addStep: vi.fn(), steps: signal<Step[]>([]).asReadonly() } }`

### API

- `GET  /api/v1/trips/{tripId}/steps` — returns `200 Ok([StepResponse])` or `404` if trip not owned
- `POST /api/v1/trips/{tripId}/steps` — JSON body `CreateStepRequest`, returns `201` with `StepResponse` or `404` if trip not owned
- Ownership enforced via: find trip by `tripId AND userId` — null → return null → controller returns 404

### Step Entity Column Specs (for migration)

| C# Property | Column | PostgreSQL Type | Nullable |
|---|---|---|---|
| `Id` | `id` | `uuid` | NOT NULL (PK) |
| `Name` | `name` | `character varying(200)` | NOT NULL |
| `Type` | `type` | `text` | NOT NULL |
| `Location` | `location` | `text` | NULL |
| `Date` | `date` | `date` | NULL |
| `StartTime` | `start_time` | `text` | NULL |
| `SortOrder` | `sort_order` | `integer` | NOT NULL |
| `Note` | `note` | `text` | NULL |
| `CreatedAt` | `created_at` | `timestamp with time zone` | NOT NULL |
| `UpdatedAt` | `updated_at` | `timestamp with time zone` | NOT NULL |
| `TripId` | `trip_id` | `uuid` | NOT NULL (FK) |

- PK constraint name: `pk_steps`
- FK constraint name: `fk_steps_trips_trip_id` → references `trips.id` with CASCADE DELETE
- Index: `ix_steps_trip_id` on `trip_id`
- **CRITICAL**: Do NOT use `order` as column name — it is a reserved word in PostgreSQL. Use `sort_order` (property `SortOrder`).
- `DateOnly?` in C# → `date` column type in PostgreSQL (Npgsql 6+ supports `DateOnly`)
- `StartTime` is `string?` (stores "HH:mm" from `<input type="time">`) — avoids `TimeOnly` JSON serialization complexity

### AppDbContext Changes

In `OnModelCreating`, add after the Trip entity block:
```csharp
builder.Entity<Step>(e =>
{
    e.HasKey(s => s.Id);
    e.Property(s => s.Id).ValueGeneratedOnAdd();
    e.Property(s => s.Name).HasMaxLength(200);
    e.Property(s => s.Type).HasConversion<string>();
    e.HasOne(s => s.Trip)
     .WithMany()
     .HasForeignKey(s => s.TripId)
     .OnDelete(DeleteBehavior.Cascade);
});
```

### SortOrder Calculation

In `AddStepAsync`:
```csharp
var maxOrder = await _dbContext.Steps
    .Where(s => s.TripId == tripId)
    .MaxAsync(s => (int?)s.SortOrder) ?? 0;
// new step SortOrder = maxOrder + 1
```

### Angular — StepService Patterns

- `addStep` sends plain JSON (not FormData): `this.http.post<Step>(url, request)` where `request` is `CreateStepRequest`
- Signal init: `private readonly _steps = signal<Step[]>([])` — reset to `[]` when navigating to a new trip (caller calls `getSteps` which sets all steps)
- `getSteps` completely replaces signal: `tap(steps => this._steps.set(steps))`
- `addStep` appends: `tap(step => this._steps.update(list => [...list, step]))`

### Angular — StepListComponent Details

- Location: `rollplan-client/src/app/steps/step-list/` (matching architecture folder structure)
- Component selector: `app-step-list`
- Must be `standalone: true`, imports: `[CommonModule, ReactiveFormsModule]`
- `@Input() tripId!: string` — receives tripId from TripDetailComponent
- The component is responsible for calling `getSteps(tripId)` on init to populate its list
- Form validation: `name` is required, `type` is required (use `Validators.required`); other fields optional
- On submit success: reset form values to initial (empty), `showAddForm.set(false)`
- Type select: `<option *ngFor="let t of stepTypes" [value]="t">{{ t }}</option>`
- Type badge colors (Tailwind): Travel=blue, Accommodation=purple, Activity=green, Meal=orange, Rest=gray

### Angular — TripDetailComponent Changes

- Change `private tripId = ''` to `tripId = ''` (remove `private`) so template binding `[tripId]="tripId"` works
- Add `StepListComponent` to `imports: [...]` array in `@Component` decorator
- Place `<app-step-list [tripId]="tripId"></app-step-list>` inside the `*ngIf="!isEditing()"` block in the view section, below the existing buttons — only show steps when not in edit mode

### Migration File Approach

Since `dotnet ef` is not available in this environment, create migration files manually following the exact format of `rollplan-api/Migrations/20260509000002_AddTripDates.cs` and `20260509000002_AddTripDates.Designer.cs`. The Designer.cs must include ALL entity definitions up through this migration (copy the full model snapshot from the existing Designer.cs of the previous migration and add the Step entity). The `AppDbContextModelSnapshot.cs` gets the Step entity block added, plus the relationship block.

### Test File Locations

- Backend: `rollplan-api-tests/Services/StepServiceTests.cs` (new file, follow same class structure as `TripServiceTests.cs`)
- Angular service: `rollplan-client/src/app/steps/services/step.service.spec.ts`
- Angular component: `rollplan-client/src/app/steps/step-list/step-list.component.spec.ts`

### Program.cs Registration

Add alongside the existing `TripService` registration:
```csharp
builder.Services.AddScoped<IStepService, StepService>();
```

## Dev Agent Record

### Agent Model Used

(to be filled in by dev agent)

### File List

- `rollplan-api/Models/Entities/StepType.cs` (new)
- `rollplan-api/Models/Entities/Step.cs` (new)
- `rollplan-api/Data/AppDbContext.cs` (modified)
- `rollplan-api/Models/DTOs/Steps/CreateStepRequest.cs` (new)
- `rollplan-api/Models/DTOs/Steps/CreateStepRequestValidator.cs` (new)
- `rollplan-api/Models/DTOs/Steps/StepResponse.cs` (new)
- `rollplan-api/Services/IStepService.cs` (new)
- `rollplan-api/Services/StepService.cs` (new)
- `rollplan-api/Controllers/StepsController.cs` (new)
- `rollplan-api/Program.cs` (modified)
- `rollplan-api/Migrations/20260509000003_AddStepsTable.cs` (new)
- `rollplan-api/Migrations/20260509000003_AddStepsTable.Designer.cs` (new)
- `rollplan-api/Migrations/AppDbContextModelSnapshot.cs` (modified)
- `rollplan-api-tests/Services/StepServiceTests.cs` (new)
- `rollplan-client/src/app/steps/services/step.service.ts` (new)
- `rollplan-client/src/app/steps/services/step.service.spec.ts` (new)
- `rollplan-client/src/app/steps/step-list/step-list.component.ts` (new)
- `rollplan-client/src/app/steps/step-list/step-list.component.html` (new)
- `rollplan-client/src/app/steps/step-list/step-list.component.spec.ts` (new)
- `rollplan-client/src/app/trips/trip-detail/trip-detail.component.ts` (modified)
- `rollplan-client/src/app/trips/trip-detail/trip-detail.component.html` (modified)

### Change Log
