# Story 3.2: Search Step Location via Autocomplete

Status: done

## Story

As an **authenticated user**,
I want to search for a step location using place autocomplete,
So that I can quickly find and attach accurate location data to a step.

## Acceptance Criteria

1. **Given** an authenticated user adding a step
   **When** they type in the location field
   **Then** Google Places autocomplete suggestions appear below the input
   **And** selecting a suggestion populates the location name in the text field
   **And** selecting a suggestion stores the lat/lng coordinates with the step
   **And** coordinates are persisted to the database and returned in the API response

2. **Given** the Google Places API is unavailable (key missing or network error)
   **When** the user types in the location field
   **Then** the field functions as a plain text input with no autocomplete
   **And** the step can still be saved with a manually typed location name (no coordinates)

## Tasks / Subtasks

- [x] Task 1: Backend — Add Latitude/Longitude to Step entity + migration (AC: #1)
  - [x] In `rollplan-api/Models/Entities/Step.cs`: add `public double? Latitude { get; set; }` and `public double? Longitude { get; set; }` after the `Location` property
  - [x] Create `rollplan-api/Migrations/20260509000005_AddStepCoordinates.cs` — `AddColumn<double>` for `latitude` and `longitude` on table `steps` (both nullable, type `double precision`) with Down using `DropColumn`
  - [x] Create `rollplan-api/Migrations/20260509000005_AddStepCoordinates.Designer.cs` — copy pattern from `20260509000004_ChangeTripDatesToDate.Designer.cs`; update Trip entity (DateOnly? for start_date/end_date) and Step entity (add Latitude + Longitude as `double?` / `"double precision"`)
  - [x] Update `rollplan-api/Migrations/AppDbContextModelSnapshot.cs` — add `b.Property<double?>("Latitude").HasColumnType("double precision").HasColumnName("latitude");` and same for `Longitude` inside the Step entity block (after Location property)

- [x] Task 2: Backend — Update DTOs and StepService (AC: #1)
  - [x] In `rollplan-api/Models/DTOs/Steps/CreateStepRequest.cs`: add `public double? Latitude { get; set; }` and `public double? Longitude { get; set; }`
  - [x] In `rollplan-api/Models/DTOs/Steps/StepResponse.cs`: add `public double? Latitude { get; set; }` and `public double? Longitude { get; set; }`
  - [x] In `rollplan-api/Services/StepService.cs` `AddStepAsync`: set `Latitude = request.Latitude` and `Longitude = request.Longitude` on the new `Step` object (alongside existing fields)
  - [x] In `rollplan-api/Services/StepService.cs` `MapToResponse`: add `Latitude = step.Latitude` and `Longitude = step.Longitude` to the returned `StepResponse`

- [x] Task 3: Backend — Unit tests (AC: #1, #2)
  - [x] In `rollplan-api-tests/Services/StepServiceTests.cs`: add `AddStepAsync_StoresCoordinates_WhenProvided` — seed trip, call AddStepAsync with `Latitude = 48.8566` and `Longitude = 2.3522`, assert response has matching lat/lng and saved entity has matching lat/lng
  - [x] In `rollplan-api-tests/Services/StepServiceTests.cs`: add `AddStepAsync_StoresNullCoordinates_WhenNotProvided` — seed trip, call AddStepAsync with no Latitude/Longitude (null), assert response Latitude and Longitude are null

- [x] Task 4: Angular — Update interfaces and create PlacesService (AC: #1, #2)
  - [x] In `rollplan-client/src/app/steps/services/step.service.ts`: add `latitude?: number` and `longitude?: number` to the `Step` interface and the `CreateStepRequest` interface
  - [x] Create `rollplan-client/src/app/core/services/places.service.ts` — see Dev Notes for full implementation

- [x] Task 5: Angular — Create PlacesAutocompleteDirective (AC: #1, #2)
  - [x] Create directory `rollplan-client/src/app/shared/directives/`
  - [x] Create `rollplan-client/src/app/shared/directives/places-autocomplete.directive.ts` — see Dev Notes for full implementation

- [x] Task 6: Angular — Update StepListComponent for autocomplete (AC: #1, #2)
  - [ ] In `rollplan-client/src/app/steps/step-list/step-list.component.ts`:
    - [x] Add `PlacesAutocompleteDirective` to the component's `imports` array
    - [x] Add `latitude` and `longitude` form controls to the `FormGroup` (both `[null]` default, no validators)
    - [x] Add `onPlaceSelected(event: PlaceSelectedEvent): void` method — sets `this.form.patchValue({ location: event.name, latitude: event.lat, longitude: event.lng })`
    - [x] In `onSubmit()`: add `latitude: this.form.value.latitude ?? undefined` and `longitude: this.form.value.longitude ?? undefined` to the `addStep` call's request object
  - [x] In `rollplan-client/src/app/steps/step-list/step-list.component.html`: add `appPlacesAutocomplete (placeSelected)="onPlaceSelected($event)"` to the location `<input>` element (the `id="stepLocation"` input)

- [x] Task 7: Angular — Unit tests (AC: #1, #2)
  - [x] Create `rollplan-client/src/app/core/services/places.service.spec.ts`: 2 tests — `should be created` and `isAvailable should return false when google is not loaded`
  - [x] Create `rollplan-client/src/app/shared/directives/places-autocomplete.directive.spec.ts`: 2 tests — `should create` and `should not throw when google.maps is unavailable`
  - [x] In `rollplan-client/src/app/steps/step-list/step-list.component.spec.ts`: add `PlacesAutocompleteDirective` stub to the TestBed setup; add test `should set lat/lng form values on placeSelected`

## Dev Notes

### What Already Exists — Reuse These Patterns

- `StepService.AddStepAsync` creates a `Step` entity and calls `SaveChangesAsync` — just add Latitude/Longitude to the object initializer (same as how `Location`, `Date`, `StartTime` are set)
- `StepService.MapToResponse` returns a `StepResponse` — just add two fields to the object initializer
- Migration manual creation: copy `20260509000004_ChangeTripDatesToDate.Designer.cs` as the base for the new Designer.cs, then update the Step entity block to add Latitude + Longitude
- `environment.ts` already has `mapsApiKey: ''` — `PlacesService` reads from it, loads script only if key is non-empty
- `step-list.component.ts` `onSubmit()` pattern: destructure `this.form.value`, pass named fields to `addStep()` — add `latitude` and `longitude` to the destructuring and to the request
- Vitest stub pattern: `PlacesAutocompleteDirective` needs to be importable in tests — create a stub or import the real directive (it does nothing when google is unavailable, so the real directive is safe to import in tests)

### Step Entity — New Column Specs (for migration)

| C# Property | Column | PostgreSQL Type | Nullable |
|---|---|---|---|
| `Latitude` | `latitude` | `double precision` | NULL |
| `Longitude` | `longitude` | `double precision` | NULL |

- `double?` in C# → `double precision` (also called `float8`) in PostgreSQL
- Both columns are nullable — coordinates are optional (fallback plain-text mode)
- `AlterTable` is not needed — just `AddColumn` for both on table `"steps"`
- No index needed on lat/lng columns

### Migration File (`20260509000005_AddStepCoordinates.cs`)

```csharp
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RollPlan.Api.Migrations
{
    public partial class AddStepCoordinates : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<double>(
                name: "latitude",
                table: "steps",
                type: "double precision",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "longitude",
                table: "steps",
                type: "double precision",
                nullable: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(name: "latitude", table: "steps");
            migrationBuilder.DropColumn(name: "longitude", table: "steps");
        }
    }
}
```

### AppDbContextModelSnapshot.cs — Step Entity Changes

In the Step entity block (currently around line 260–330), add AFTER the `Location` property block:

```csharp
b.Property<double?>("Latitude")
    .HasColumnType("double precision")
    .HasColumnName("latitude");

b.Property<double?>("Longitude")
    .HasColumnType("double precision")
    .HasColumnName("longitude");
```

### PlacesService Implementation

File: `rollplan-client/src/app/core/services/places.service.ts`

```typescript
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

export interface PlaceSelectedEvent {
  name: string;
  lat: number;
  lng: number;
}

@Injectable({ providedIn: 'root' })
export class PlacesService {
  private scriptLoaded = false;

  load(): Promise<void> {
    if (!environment.mapsApiKey) return Promise.resolve();
    if (this.scriptLoaded || this.isAvailable()) {
      this.scriptLoaded = true;
      return Promise.resolve();
    }
    return new Promise<void>((resolve) => {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${environment.mapsApiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => { this.scriptLoaded = true; resolve(); };
      script.onerror = () => resolve(); // silently fall back to plain text
      document.head.appendChild(script);
    });
  }

  isAvailable(): boolean {
    return typeof (window as any)['google']?.maps?.places !== 'undefined'
      && (window as any)['google']?.maps?.places !== undefined;
  }
}
```

### PlacesAutocompleteDirective Implementation

File: `rollplan-client/src/app/shared/directives/places-autocomplete.directive.ts`

```typescript
import { Directive, ElementRef, EventEmitter, OnDestroy, OnInit, Output, inject } from '@angular/core';
import { PlacesService, PlaceSelectedEvent } from '../../core/services/places.service';

@Directive({ selector: '[appPlacesAutocomplete]', standalone: true })
export class PlacesAutocompleteDirective implements OnInit, OnDestroy {
  @Output() placeSelected = new EventEmitter<PlaceSelectedEvent>();

  private readonly el = inject(ElementRef);
  private readonly placesService = inject(PlacesService);
  private autocomplete: any = null;
  private listener: any = null;

  ngOnInit(): void {
    this.placesService.load().then(() => {
      if (!this.placesService.isAvailable()) return; // plain text fallback
      const g = (window as any)['google'];
      this.autocomplete = new g.maps.places.Autocomplete(
        this.el.nativeElement as HTMLInputElement,
        { fields: ['formatted_address', 'name', 'geometry'] }
      );
      this.listener = this.autocomplete.addListener('place_changed', () => {
        const place = this.autocomplete.getPlace();
        if (!place?.geometry?.location) return;
        const name = place.formatted_address ?? place.name ?? '';
        this.placeSelected.emit({
          name,
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng()
        });
      });
    });
  }

  ngOnDestroy(): void {
    if (this.listener) {
      const g = (window as any)['google'];
      g?.maps?.event?.removeListener(this.listener);
    }
    this.autocomplete = null;
  }
}
```

**Key implementation notes:**
- `fields: ['formatted_address', 'name', 'geometry']` limits the Places API fields used (billing optimization)
- `place.formatted_address ?? place.name ?? ''` — `formatted_address` is preferred (full address), `name` is the establishment name fallback
- If geometry is missing (can happen for some place types), do nothing — user retains whatever text is in the field
- The directive is `standalone: true` and imported directly in `StepListComponent`

### StepListComponent Changes

**In `step-list.component.ts`:**
1. Import: `import { PlacesAutocompleteDirective } from '../../shared/directives/places-autocomplete.directive';` and `import { PlaceSelectedEvent } from '../../core/services/places.service';`
2. Add `PlacesAutocompleteDirective` to the `imports: [CommonModule, ReactiveFormsModule]` array
3. Form group — add two new controls after `startTime`:
   ```typescript
   latitude: [null as number | null],
   longitude: [null as number | null]
   ```
4. New method:
   ```typescript
   onPlaceSelected(event: PlaceSelectedEvent): void {
     this.form.patchValue({ location: event.name, latitude: event.lat, longitude: event.lng });
   }
   ```
5. In `onSubmit()` — update the destructuring and the `addStep` call:
   ```typescript
   const { name, type, location, date, startTime, latitude, longitude } = this.form.value;
   // in addStep call:
   this.stepService.addStep(this.tripId, {
     name,
     type,
     location: location?.trim() || undefined,
     date: date || undefined,
     startTime: startTime || undefined,
     latitude: latitude ?? undefined,
     longitude: longitude ?? undefined
   })
   ```

**In `step-list.component.html`:**
Replace the location input opening tag line from:
```html
<input
  id="stepLocation"
  type="text"
  formControlName="location"
  placeholder="e.g. Portsmouth Harbour"
```
to:
```html
<input
  id="stepLocation"
  type="text"
  formControlName="location"
  placeholder="e.g. Portsmouth Harbour"
  appPlacesAutocomplete
  (placeSelected)="onPlaceSelected($event)"
```

### Angular Unit Tests

**`places.service.spec.ts`:**
```typescript
import { TestBed } from '@angular/core/testing';
import { PlacesService } from './places.service';

describe('PlacesService', () => {
  let service: PlacesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PlacesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('isAvailable should return false when google is not loaded', () => {
    // In test environment window.google is not defined
    expect(service.isAvailable()).toBe(false);
  });
});
```

**`places-autocomplete.directive.spec.ts`:**
```typescript
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { PlacesAutocompleteDirective } from './places-autocomplete.directive';

@Component({
  template: `<input appPlacesAutocomplete (placeSelected)="onPlace($event)" />`,
  standalone: true,
  imports: [PlacesAutocompleteDirective]
})
class TestHostComponent {
  onPlace(e: any) {}
}

describe('PlacesAutocompleteDirective', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent]
    }).compileComponents();
  });

  it('should create without error when google is unavailable', () => {
    // google.maps is not defined in test env — directive should not throw
    const fixture = TestBed.createComponent(TestHostComponent);
    expect(() => fixture.detectChanges()).not.toThrow();
  });

  it('should render the host input element', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('input')).toBeTruthy();
  });
});
```

**`step-list.component.spec.ts` addition:**
Add a stub directive in TestBed to replace the real directive (avoids async Places API loading):
```typescript
import { Directive, EventEmitter, Output } from '@angular/core';
import { PlaceSelectedEvent } from '../../core/services/places.service';

@Directive({ selector: '[appPlacesAutocomplete]', standalone: true })
class MockPlacesAutocompleteDirective {
  @Output() placeSelected = new EventEmitter<PlaceSelectedEvent>();
}
```
And add to TestBed:
```typescript
imports: [StepListComponent],
// Override StepListComponent's PlacesAutocompleteDirective with mock:
// Use TestBed overrideComponent after compileComponents, OR
// simply import StepListComponent and let the real directive load
// (it's safe: isAvailable() returns false in tests, no-op)
```
Actually since the real directive is safe in tests (does nothing when google unavailable), just import `StepListComponent` directly — the existing tests don't need modification to the TestBed setup.

Add this test to the existing describe block:
```typescript
it('should set lat/lng form values on placeSelected', () => {
  getStepsSpy.mockReturnValue(of([]));
  const fixture = TestBed.createComponent(StepListComponent);
  fixture.componentInstance.tripId = '11111111-1111-1111-1111-111111111111';
  fixture.detectChanges();
  fixture.componentInstance.showAddForm.set(true);
  fixture.detectChanges();

  fixture.componentInstance.onPlaceSelected({ name: 'Eiffel Tower, Paris', lat: 48.8584, lng: 2.2945 });

  expect(fixture.componentInstance.form.value.location).toBe('Eiffel Tower, Paris');
  expect(fixture.componentInstance.form.value.latitude).toBe(48.8584);
  expect(fixture.componentInstance.form.value.longitude).toBe(2.2945);
});
```

### API

Existing endpoints are unchanged in routing. The step creation endpoint now accepts optional lat/lng in the JSON body and returns them in the response:

- `POST /api/v1/trips/{tripId}/steps` — JSON body accepts `latitude?: number` and `longitude?: number`; response includes `latitude` and `longitude` (both nullable)
- `GET /api/v1/trips/{tripId}/steps` — response now includes `latitude` and `longitude` on each step

### Designer.cs Pattern (migration 00005)

Follow the exact pattern of `20260509000004_ChangeTripDatesToDate.Designer.cs`:
- File header: `[Migration("20260509000005_AddStepCoordinates")]`, class `AddStepCoordinates`
- Include both `Step` and `Trip` entity blocks (copy from 00004 Designer.cs)
- In the Step entity block, add Latitude and Longitude properties AFTER the Location property:
  ```csharp
  b.Property<double?>("Latitude")
      .HasColumnType("double precision")
      .HasColumnName("latitude");

  b.Property<double?>("Longitude")
      .HasColumnType("double precision")
      .HasColumnName("longitude");
  ```
- Trip entity block: use the UPDATED version (DateOnly? for start_date/end_date, NOT DateTime?)
- Include the Step→Trip navigation relationship block at the end

### Test File Locations

- Backend tests: `rollplan-api-tests/Services/StepServiceTests.cs` (add to existing file)
- Places service test: `rollplan-client/src/app/core/services/places.service.spec.ts` (new file)
- Directive test: `rollplan-client/src/app/shared/directives/places-autocomplete.directive.spec.ts` (new file)
- Step list test: `rollplan-client/src/app/steps/step-list/step-list.component.spec.ts` (add to existing file)

### No New npm Packages Required

- No `@types/google.maps` needed — uses `(window as any)['google']` casting throughout
- No Angular wrappers for Google Maps — only the JS API script is dynamically loaded
- `PlacesService.load()` gracefully no-ops when `environment.mapsApiKey` is empty (dev without key)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### File List

- `rollplan-api/Models/Entities/Step.cs` (modified)
- `rollplan-api/Models/DTOs/Steps/CreateStepRequest.cs` (modified)
- `rollplan-api/Models/DTOs/Steps/StepResponse.cs` (modified)
- `rollplan-api/Services/StepService.cs` (modified)
- `rollplan-api/Migrations/20260509000005_AddStepCoordinates.cs` (new)
- `rollplan-api/Migrations/20260509000005_AddStepCoordinates.Designer.cs` (new)
- `rollplan-api/Migrations/AppDbContextModelSnapshot.cs` (modified)
- `rollplan-api-tests/Services/StepServiceTests.cs` (modified)
- `rollplan-client/src/app/steps/services/step.service.ts` (modified)
- `rollplan-client/src/app/core/services/places.service.ts` (new)
- `rollplan-client/src/app/core/services/places.service.spec.ts` (new)
- `rollplan-client/src/app/shared/directives/places-autocomplete.directive.ts` (new)
- `rollplan-client/src/app/shared/directives/places-autocomplete.directive.spec.ts` (new)
- `rollplan-client/src/app/steps/step-list/step-list.component.ts` (modified)
- `rollplan-client/src/app/steps/step-list/step-list.component.html` (modified)
- `rollplan-client/src/app/steps/step-list/step-list.component.spec.ts` (modified)

### Change Log

- Implemented Story 3.2: added Latitude/Longitude to Step entity with migration 20260509000005, updated DTOs and StepService, created PlacesService (dynamic Google Maps script loading with graceful fallback) and PlacesAutocompleteDirective (standalone, emits placeSelected event), wired directive into StepListComponent location field. 98 Angular tests pass (17 files). (Date: 2026-05-10)

### Review Findings

- [x] [Review][Patch] Backend: add partial-coordinate validation — reject requests where only one of lat/lng is provided [`rollplan-api/Models/DTOs/Steps/CreateStepRequest.cs`]
- [x] [Review][Patch] Backend: add lat/lng range validation — Latitude must be [-90, 90], Longitude [-180, 180] [`rollplan-api/Models/DTOs/Steps/CreateStepRequest.cs`]
- [x] [Review][Patch] PlacesService: scriptLoaded not set on script error — onerror callback resolves but leaves scriptLoaded=false, causing duplicate `<script>` append on retry [`rollplan-client/src/app/core/services/places.service.ts:25`]
- [x] [Review][Patch] PlacesAutocompleteDirective: destroy race condition — async load().then() can run after ngOnDestroy, attaching a listener to a destroyed host that is never cleaned up [`rollplan-client/src/app/shared/directives/places-autocomplete.directive.ts:13`]
- [x] [Review][Patch] StepListComponent: stale coordinates after manual text clear — if user selects a place then clears the location field, lat/lng remain set and are submitted [`rollplan-client/src/app/steps/step-list/step-list.component.ts:63`]
- [x] [Review][Patch] StepServiceTests: null-coordinate test missing DB-entity assertion — test asserts response but not the saved entity in the DB [`rollplan-api-tests/Services/StepServiceTests.cs`]
- [x] [Review][Defer] Empty location name if both formatted_address and name are undefined — `place.formatted_address ?? place.name ?? ''` can yield empty string for unusual place types [`rollplan-client/src/app/shared/directives/places-autocomplete.directive.ts:24`] — deferred, pre-existing Google API edge case unlikely with requested fields
- [x] [Review][Defer] Directive selector allows non-input elements — `[appPlacesAutocomplete]` can be placed on any element, but Google Maps Autocomplete requires HTMLInputElement [`rollplan-client/src/app/shared/directives/places-autocomplete.directive.ts:4`] — deferred, enforce by convention
