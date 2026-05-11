# Story 4.2: View Route Line Connecting Steps

Status: ready-for-dev

## Story

As an **authenticated user**,
I want to see a route line connecting all steps in order on the map,
So that I can see the path of my trip at a glance.

## Acceptance Criteria

1. **Given** an authenticated user on the trip detail page with 2 or more steps that have coordinates
   **When** the map renders
   **Then** a polyline connects all located steps in their `sortOrder` sequence

2. **Given** fewer than 2 steps have coordinates
   **When** the map renders
   **Then** no polyline is drawn (only pins are shown, or the empty-state message)

3. **Given** steps are reordered (via drag-and-drop from story 3.5)
   **When** the steps signal updates
   **Then** the polyline is redrawn automatically in the new sortOrder sequence without any page reload

4. **Given** a step's coordinates are edited or removed
   **When** the steps signal updates
   **Then** the polyline is redrawn to reflect the updated set of located steps

## Tasks / Subtasks

- [ ] Task 1: Add polyline rendering to TripMapComponent (AC: #1, #2, #3, #4)
  - [ ] Add `private routeLine?: L.Polyline` field to `TripMapComponent`
  - [ ] In `updateMarkers()`: before drawing pins, call `this.routeLine?.remove()` and reset to `undefined`
  - [ ] After building the `bounds` array (which is in sortOrder), if `located.length >= 2` draw `L.polyline(bounds, { color: '#0ea5e9', weight: 3, opacity: 0.6 }).addTo(this.map!)` and store as `this.routeLine`
  - [ ] Verify polyline redraws automatically on steps signal change (already handled by existing `effect()`)

- [ ] Task 2: Update Leaflet mock and add unit tests (AC: #1, #2)
  - [ ] In `trip-map.component.spec.ts`: add `mockPolyline = { addTo: vi.fn().mockReturnThis(), remove: vi.fn() }` and `polyline: vi.fn(() => mockPolyline)` to the `vi.mock('leaflet', ...)` factory
  - [ ] Test: `should draw polyline when 2+ steps have coordinates` — provide 2 steps with coords, assert `L.polyline` was called
  - [ ] Test: `should not draw polyline when fewer than 2 steps have coordinates` — provide 1 step with coords, assert `L.polyline` was NOT called

## Dev Notes

### Scope: One File Change Only

This story adds ~6 lines to `TripMapComponent`. No new files, no new components, no backend changes. The existing reactive `effect()` already handles automatic redraw on step changes.

**Only modified file:** `rollplan-client/src/app/map/trip-map/trip-map.component.ts`
**Only modified spec:** `rollplan-client/src/app/map/trip-map/trip-map.component.spec.ts`

### Current TripMapComponent State (from story 4.1 + review patches)

```typescript
// rollplan-client/src/app/map/trip-map/trip-map.component.ts

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
    } catch (err) {
      console.error('TripMapComponent: Leaflet failed to initialize', err);
    }
  }

  private updateMarkers(steps: Step[]): void {
    this.markersLayer.clearLayers();
    const located = steps.filter(s => s.latitude != null && s.longitude != null);
    this.mapEmpty.set(located.length === 0);

    if (located.length === 0) return;

    const bounds: [number, number][] = [];
    located.forEach((step) => {
      const latlng: [number, number] = [step.latitude!, step.longitude!];
      L.circleMarker(latlng, {
        radius: 8,
        fillColor: '#0ea5e9',
        color: '#fff',
        weight: 2,
        fillOpacity: 0.9
      })
        .bindTooltip(`${step.sortOrder}. ${step.name}`)
        .addTo(this.markersLayer);
      bounds.push(latlng);
    });

    if (located.length === 1) {
      this.map!.setView(bounds[0], 13);
    } else {
      this.map!.fitBounds(L.latLngBounds(bounds), { padding: [40, 40] });
    }
    setTimeout(() => this.map?.invalidateSize(), 0);
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }
}
```

### Exact Diff to Apply

Add `private routeLine?: L.Polyline;` as a new field after `private readonly markersLayer`:

```typescript
  private map?: L.Map;
  private readonly markersLayer = L.layerGroup();
  private routeLine?: L.Polyline;           // ← ADD THIS
  private readonly stepService = inject(StepService);
```

In `updateMarkers()`, insert polyline logic after the `forEach` loop and before the `fitBounds/setView` block:

```typescript
    // After the forEach loop, before the fitBounds/setView block:
    this.routeLine?.remove();
    this.routeLine = undefined;
    if (located.length >= 2) {
      this.routeLine = L.polyline(bounds, {
        color: '#0ea5e9',
        weight: 3,
        opacity: 0.6
      }).addTo(this.map!);
    }
```

Complete updated `updateMarkers()` for clarity:

```typescript
  private updateMarkers(steps: Step[]): void {
    this.markersLayer.clearLayers();
    const located = steps.filter(s => s.latitude != null && s.longitude != null);
    this.mapEmpty.set(located.length === 0);

    if (located.length === 0) return;

    const bounds: [number, number][] = [];
    located.forEach((step) => {
      const latlng: [number, number] = [step.latitude!, step.longitude!];
      L.circleMarker(latlng, {
        radius: 8,
        fillColor: '#0ea5e9',
        color: '#fff',
        weight: 2,
        fillOpacity: 0.9
      })
        .bindTooltip(`${step.sortOrder}. ${step.name}`)
        .addTo(this.markersLayer);
      bounds.push(latlng);
    });

    this.routeLine?.remove();
    this.routeLine = undefined;
    if (located.length >= 2) {
      this.routeLine = L.polyline(bounds, {
        color: '#0ea5e9',
        weight: 3,
        opacity: 0.6
      }).addTo(this.map!);
    }

    if (located.length === 1) {
      this.map!.setView(bounds[0], 13);
    } else {
      this.map!.fitBounds(L.latLngBounds(bounds), { padding: [40, 40] });
    }
    setTimeout(() => this.map?.invalidateSize(), 0);
  }
```

### Why `located` Is Already in SortOrder

`stepService.steps()` is populated by `GET /api/v1/trips/{tripId}/steps`, which the backend returns ordered by `SortOrder`. The filter preserves this order. No explicit re-sort is needed — `bounds` is built in sortOrder sequence.

### Reactive Auto-Update (AC #3, #4)

The existing `effect()` in the constructor already covers this:

```typescript
effect(() => {
  const steps = this.stepService.steps();  // re-runs when signal changes
  if (this.map) {
    this.updateMarkers(steps);             // clears and redraws everything
  }
});
```

When steps are reordered (story 3.5 updates `StepService._steps`), the effect fires, `updateMarkers` clears `markersLayer` and removes the old `routeLine`, then redraws both with the new ordering. No additional wiring needed.

### Leaflet Mock — Required Addition for Spec

The current mock in `trip-map.component.spec.ts` does NOT have `polyline`. Add it:

```typescript
vi.mock('leaflet', () => {
  const mockLayer = { addTo: vi.fn().mockReturnThis(), clearLayers: vi.fn() };
  const mockMap = {
    setView: vi.fn().mockReturnThis(),
    addLayer: vi.fn(),
    fitBounds: vi.fn(),
    invalidateSize: vi.fn(),
    remove: vi.fn()
  };
  const mockMarker = { bindTooltip: vi.fn().mockReturnThis(), addTo: vi.fn().mockReturnThis() };
  const mockPolyline = { addTo: vi.fn().mockReturnThis(), remove: vi.fn() };  // ← ADD
  return {
    map: vi.fn(() => mockMap),
    tileLayer: vi.fn(() => ({ addTo: vi.fn() })),
    layerGroup: vi.fn(() => mockLayer),
    circleMarker: vi.fn(() => mockMarker),
    latLngBounds: vi.fn(() => ({})),
    polyline: vi.fn(() => mockPolyline)  // ← ADD
  };
});
```

### New Test Cases

```typescript
it('should draw polyline when 2+ steps have coordinates', () => {
  stepsSignal.set([stepWithCoords, stepWithCoords2]);
  const fixture = TestBed.createComponent(TripMapComponent);
  fixture.detectChanges();
  // L.polyline should have been called once
  const L = vi.mocked(await import('leaflet'));
  // Use the imported leaflet mock from vitest
  expect(vi.mocked(L.polyline)).toHaveBeenCalledTimes(1);
});

it('should not draw polyline when fewer than 2 steps have coordinates', () => {
  stepsSignal.set([stepWithCoords]);
  const fixture = TestBed.createComponent(TripMapComponent);
  fixture.detectChanges();
  expect(vi.mocked(L.polyline)).not.toHaveBeenCalled();
});
```

**Note on testing pattern**: The existing spec file uses `vi.mock('leaflet', ...)` hoisting at the top (before imports). To assert on mock call counts, import `L` after the mock block and use `vi.mocked`. Alternatively (simpler), import `* as L from 'leaflet'` at the top of the test file (after the vi.mock block — vitest hoisting ensures the mock is in place) and use `(L.polyline as ReturnType<typeof vi.fn>).mock.calls.length` or simply check `(L.polyline as any).mock.calls.length`. See the pattern used in other spec files if available.

**Simplest assertion pattern** — avoids complex typing:

```typescript
import * as L from 'leaflet';
// In test:
expect((L.polyline as jest.Mock).mock.calls).toHaveLength(1);
// or with vitest:
expect(vi.mocked(L.polyline).mock.calls).toHaveLength(1);
```

Since `vi.mock` is hoisted, `import * as L from 'leaflet'` in the spec file will reference the mock.

### `stepWithCoords2` Fixture Needed

The new tests need a second step with coordinates. Add to the existing fixtures at the top of the spec file:

```typescript
const stepWithCoords2: Step = {
  id: 'aaaa-0003',
  tripId: 'bbbb-0001',
  name: 'Louvre Museum',
  type: 'Activity',
  sortOrder: 3,
  latitude: 48.8606,
  longitude: 2.3376,
  createdAt: '2026-05-01T00:00:00Z',
  updatedAt: '2026-05-01T00:00:00Z'
};
```

### No Backend Changes

This story is purely frontend. `latitude`, `longitude`, and `sortOrder` are already in every `StepResponse`. No migrations, controllers, or services change.

### Anti-Patterns to Avoid

- **Do NOT** create a separate `RouteLineComponent` — the polyline belongs in `TripMapComponent` alongside the pins
- **Do NOT** add another `effect()` — the existing one handles all reactive updates
- **Do NOT** use `markersLayer` to store the polyline — keep it as a direct map layer reference (`this.routeLine`) so it can be removed cleanly with `.remove()`
- **Do NOT** call `this.routeLine?.remove()` in `ngOnDestroy` — `this.map?.remove()` already cleans up all layers attached to the map

## Dev Agent Record

### Agent Model Used

(to be filled)

### File List

- `rollplan-client/src/app/map/trip-map/trip-map.component.ts` (modified)
- `rollplan-client/src/app/map/trip-map/trip-map.component.spec.ts` (modified)

### Change Log

(to be filled)
