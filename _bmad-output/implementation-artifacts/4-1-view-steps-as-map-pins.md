# Story 4.1: View Steps as Map Pins

Status: ready-for-dev

## Story

As an **authenticated user**,
I want to see all trip steps displayed as pins on an interactive map,
So that I can visualize the geography of my trip.

## Acceptance Criteria

1. **Given** an authenticated user on the trip detail page
   **When** the map section renders
   **Then** all steps with `latitude` and `longitude` values are shown as pins on the map
   **And** the map fits its bounds to include all visible pins

2. **Given** a step has no latitude/longitude
   **When** the map renders
   **Then** that step is excluded from the map
   **And** it remains visible in the step list below the map

3. **Given** no steps have coordinates
   **When** the map section renders
   **Then** the map canvas is hidden
   **And** a message "No steps with locations yet. Add a location to a step to see it on the map." is shown in its place

4. **Given** the Leaflet map fails to initialize (exception thrown)
   **When** the map container renders
   **Then** the map section shows no broken content (graceful fallback — same empty state)

5. **Given** the map is rendered with pins
   **When** a user hovers over a pin
   **Then** a tooltip shows the step number and name (e.g. "1. Ferry Crossing")

## Tasks / Subtasks

- [ ] Task 1: Install Leaflet and configure styles
  - [ ] Run `npm install leaflet @types/leaflet` in `rollplan-client/`
  - [ ] Add `"node_modules/leaflet/dist/leaflet.css"` to the `styles` array in `rollplan-client/angular.json`
  - [ ] Verify `leaflet` and `@types/leaflet` appear in `package.json` dependencies/devDependencies

- [ ] Task 2: Create TripMapComponent (AC: #1, #2, #3, #4, #5)
  - [ ] Create `rollplan-client/src/app/map/trip-map/trip-map.component.ts` — standalone, imports `CommonModule`; injects `StepService`; `@ViewChild('mapContainer')` ElementRef; `mapEmpty = signal(true)`; `effect()` in constructor to call `updateMarkers(steps)` when signal changes (guard with `if (this.map)`); `ngAfterViewInit` initialises Leaflet in try/catch and calls `updateMarkers` for initial render; `updateMarkers` clears `markersLayer`, filters steps to those with non-null lat/lng, sets `mapEmpty`, adds `L.circleMarker` per located step with sky-500 fill and tooltip `"N. name"`, calls `map.fitBounds()` when >0 pins; `ngOnDestroy` calls `map?.remove()`
  - [ ] Create `rollplan-client/src/app/map/trip-map/trip-map.component.html` — outer wrapper with section heading "Map"; `*ngIf="mapEmpty()"` empty-state div with dashed border message; `#mapContainer` div with `[class.hidden]="mapEmpty()"` and `style="height:400px"` and ring styling

- [ ] Task 3: Integrate TripMapComponent into TripDetailComponent (AC: #1)
  - [ ] In `rollplan-client/src/app/trips/trip-detail/trip-detail.component.ts`: import `TripMapComponent`, add to `imports` array
  - [ ] In `rollplan-client/src/app/trips/trip-detail/trip-detail.component.html`: add `<app-trip-map></app-trip-map>` after `<app-step-list [tripId]="trip()!.id">`

- [ ] Task 4: Angular unit tests for TripMapComponent (AC: #1, #2, #3)
  - [ ] Create `rollplan-client/src/app/map/trip-map/trip-map.component.spec.ts`
  - [ ] Mock `leaflet` entirely with `vi.mock('leaflet', ...)` (jsdom has no canvas; see Dev Notes for mock shape)
  - [ ] Test: `should set mapEmpty to true when no steps have coordinates` — provide `steps` signal with steps missing lat/lng, call `ngAfterViewInit`, assert `mapEmpty()` is `true`
  - [ ] Test: `should set mapEmpty to false when at least one step has coordinates` — provide step with lat/lng, assert `mapEmpty()` is `false`
  - [ ] Test: `should create component` — basic smoke test

## Dev Notes

### Prerequisite: Install Leaflet

```bash
cd rollplan-client && npm install leaflet @types/leaflet
```

Then in `rollplan-client/angular.json`, find the `"styles"` array under `projects.rollplan-client.architect.build.options` and add:

```json
"node_modules/leaflet/dist/leaflet.css"
```

Also add the same entry under `projects.rollplan-client.architect.test.options.styles` if present (for test builds).

### Why Direct Leaflet, Not ngx-leaflet

The architecture doc says "Leaflet + ngx-leaflet". However, `@asymmetrik/ngx-leaflet` has not been updated for Angular 21 standalone components and does not support Angular signals. Use Leaflet directly via `import * as L from 'leaflet'` — this is idiomatic for Angular 21 standalone and avoids wrapper-library incompatibilities.

### New Directory

Create `rollplan-client/src/app/map/trip-map/` (new feature folder matching architecture spec).

### TripMapComponent — Full Implementation

```typescript
import { Component, AfterViewInit, OnDestroy, ViewChild, ElementRef, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';
import { StepService, Step } from '../../steps/services/step.service';

@Component({
  selector: 'app-trip-map',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './trip-map.component.html'
})
export class TripMapComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mapContainer') mapContainer!: ElementRef<HTMLDivElement>;

  private map?: L.Map;
  private readonly markersLayer = L.layerGroup();
  private readonly stepService = inject(StepService);

  readonly mapEmpty = signal(true);

  constructor() {
    effect(() => {
      const steps = this.stepService.steps();
      if (this.map) {
        this.updateMarkers(steps);
      }
    });
  }

  ngAfterViewInit(): void {
    try {
      this.map = L.map(this.mapContainer.nativeElement).setView([20, 0], 2);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(this.map);
      this.markersLayer.addTo(this.map);
      this.updateMarkers(this.stepService.steps());
    } catch {
      // Leaflet failed to initialize (e.g. jsdom) — mapEmpty remains true
    }
  }

  private updateMarkers(steps: Step[]): void {
    this.markersLayer.clearLayers();
    const located = steps.filter(s => s.latitude != null && s.longitude != null);
    this.mapEmpty.set(located.length === 0);

    if (located.length === 0) return;

    const bounds: [number, number][] = [];
    located.forEach((step, i) => {
      const latlng: [number, number] = [step.latitude!, step.longitude!];
      L.circleMarker(latlng, {
        radius: 8,
        fillColor: '#0ea5e9',
        color: '#fff',
        weight: 2,
        fillOpacity: 0.9
      })
        .bindTooltip(`${i + 1}. ${step.name}`)
        .addTo(this.markersLayer);
      bounds.push(latlng);
    });

    this.map!.fitBounds(L.latLngBounds(bounds), { padding: [40, 40] });
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }
}
```

**Why `L.circleMarker` instead of `L.marker`:** Default `L.marker` relies on image files (PNG icons) that require asset path configuration in webpack/esbuild builds. `L.circleMarker` renders as SVG with no external assets, matching the app's sky-500 colour scheme.

**Why `effect()` in constructor:** Angular 21 requires `effect()` to run in an injection context (constructor or field initializer). The `if (this.map)` guard prevents it from trying to update before `ngAfterViewInit` has run. The explicit `updateMarkers` call in `ngAfterViewInit` handles the initial render since the effect already ran (no-op) during construction.

### TripMapComponent Template

```html
<div class="mt-8">
  <h2 class="text-lg font-semibold text-white mb-4">Map</h2>

  <div *ngIf="mapEmpty()" class="rounded-2xl border border-dashed border-slate-700 p-8 text-center">
    <p class="text-sm text-slate-500">No steps with locations yet. Add a location to a step to see it on the map.</p>
  </div>

  <div
    #mapContainer
    [class.hidden]="mapEmpty()"
    class="rounded-2xl overflow-hidden ring-1 ring-white/10"
    style="height: 400px;"
  ></div>
</div>
```

### TripDetailComponent Changes

`trip-detail.component.ts` — add import and to `imports` array:
```typescript
import { TripMapComponent } from '../../map/trip-map/trip-map.component';
// ...
imports: [..., TripMapComponent]
```

`trip-detail.component.html` — add after `<app-step-list>`:
```html
<app-trip-map></app-trip-map>
```

### Map Placement for v1

The map is always visible below the step list for Story 4.1. Story 4.4 (Toggle Between Map and List View) will add a toggle control to switch between them. No toggle UI is in scope for this story.

### Unit Test Strategy — Mocking Leaflet

Leaflet fails in jsdom (no canvas/WebGL). Use `vi.mock` at the top of the spec file before any imports:

```typescript
import { vi } from 'vitest';

vi.mock('leaflet', () => {
  const mockLayer = { addTo: vi.fn().mockReturnThis(), clearLayers: vi.fn() };
  const mockMap = {
    setView: vi.fn().mockReturnThis(),
    addLayer: vi.fn(),
    fitBounds: vi.fn(),
    remove: vi.fn()
  };
  const mockMarker = { bindTooltip: vi.fn().mockReturnThis(), addTo: vi.fn().mockReturnThis() };
  return {
    map: vi.fn(() => mockMap),
    tileLayer: vi.fn(() => ({ addTo: vi.fn() })),
    layerGroup: vi.fn(() => mockLayer),
    circleMarker: vi.fn(() => mockMarker),
    latLngBounds: vi.fn(() => ({}))
  };
});
```

With this mock, `ngAfterViewInit` won't throw (Leaflet calls are no-ops), and you can test signal state (`mapEmpty`) directly.

### Spec File Scaffold

```typescript
import { vi } from 'vitest';

vi.mock('leaflet', () => {
  const mockLayer = { addTo: vi.fn().mockReturnThis(), clearLayers: vi.fn() };
  const mockMap = { setView: vi.fn().mockReturnThis(), addLayer: vi.fn(), fitBounds: vi.fn(), remove: vi.fn() };
  const mockMarker = { bindTooltip: vi.fn().mockReturnThis(), addTo: vi.fn().mockReturnThis() };
  return {
    map: vi.fn(() => mockMap),
    tileLayer: vi.fn(() => ({ addTo: vi.fn() })),
    layerGroup: vi.fn(() => mockLayer),
    circleMarker: vi.fn(() => mockMarker),
    latLngBounds: vi.fn(() => ({}))
  };
});

import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { TripMapComponent } from './trip-map.component';
import { StepService, Step } from '../../steps/services/step.service';

const stepWithCoords: Step = {
  id: 'aaaa', tripId: 'bbbb', name: 'Paris', type: 'Activity',
  sortOrder: 1, latitude: 48.8566, longitude: 2.3522,
  createdAt: '2026-05-01T00:00:00Z', updatedAt: '2026-05-01T00:00:00Z'
};
const stepNoCoords: Step = {
  id: 'cccc', tripId: 'bbbb', name: 'Hotel', type: 'Accommodation',
  sortOrder: 2, createdAt: '2026-05-01T00:00:00Z', updatedAt: '2026-05-01T00:00:00Z'
};

describe('TripMapComponent', () => {
  let stepsSignal: ReturnType<typeof signal<Step[]>>;

  beforeEach(async () => {
    stepsSignal = signal<Step[]>([]);

    await TestBed.configureTestingModule({
      imports: [TripMapComponent],
      providers: [
        { provide: StepService, useValue: { steps: stepsSignal.asReadonly() } }
      ]
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(TripMapComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should set mapEmpty to true when no steps have coordinates', () => {
    stepsSignal.set([stepNoCoords]);
    const fixture = TestBed.createComponent(TripMapComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.mapEmpty()).toBe(true);
  });

  it('should set mapEmpty to false when at least one step has coordinates', () => {
    stepsSignal.set([stepWithCoords, stepNoCoords]);
    const fixture = TestBed.createComponent(TripMapComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.mapEmpty()).toBe(false);
  });
});
```

### No Backend Changes

This story is purely frontend. The `Step` entity's `latitude` and `longitude` fields already exist in the database and are returned by `GET /api/v1/trips/{tripId}/steps`. No migrations, controllers, or services need to change.

### StepService steps() Signal

`StepService.steps` (readonly signal) is populated by `getSteps(tripId)` called in `StepListComponent.ngOnInit`. `TripMapComponent` reads the same signal reactively — no additional API calls needed.

### API

No new endpoints. All data comes from the existing `GET /api/v1/trips/{tripId}/steps` response which already includes `latitude` and `longitude` in each `StepResponse`.

## Dev Agent Record

### Agent Model Used

(to be filled)

### File List

- `rollplan-client/package.json` (modified — leaflet, @types/leaflet added)
- `rollplan-client/package-lock.json` (modified)
- `rollplan-client/angular.json` (modified — leaflet.css added to styles)
- `rollplan-client/src/app/map/trip-map/trip-map.component.ts` (new)
- `rollplan-client/src/app/map/trip-map/trip-map.component.html` (new)
- `rollplan-client/src/app/map/trip-map/trip-map.component.spec.ts` (new)
- `rollplan-client/src/app/trips/trip-detail/trip-detail.component.ts` (modified)
- `rollplan-client/src/app/trips/trip-detail/trip-detail.component.html` (modified)

### Change Log

(to be filled)
