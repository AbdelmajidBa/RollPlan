# Story 4.3: Tap Pin to Open Step Details

Status: done

## Story

As an **authenticated user**,
I want to tap or click a map pin to see step details,
So that I can quickly access step information from the map.

## Acceptance Criteria

1. **Given** an authenticated user on the map view
   **When** they tap or click a map pin
   **Then** a popup opens showing the step's name, type, date (if set), and time (if set)

2. **Given** a popup is open
   **When** the user taps anywhere else on the map
   **Then** the popup closes

3. **Given** a popup is open
   **When** the popup renders
   **Then** it includes a "View in trip" link that navigates to the trip detail page

## Tasks / Subtasks

- [x] Task 1: Add `tripId` input and `buildPopupHtml` helper to TripMapComponent (AC: #1, #3)
  - [x] Add `Input` to the `@angular/core` import in `trip-map.component.ts`
  - [x] Add `@Input() tripId = ''` field to `TripMapComponent`
  - [x] Add private `buildPopupHtml(step: Step): string` method — returns HTML string with name (bold), type, date (if truthy), startTime (if truthy), and an `<a href="/trips/{tripId}">View in trip</a>` link (only rendered when `this.tripId` is set)
  - [x] In `updateMarkers()`: chain `.bindPopup(this.buildPopupHtml(step))` immediately after `.bindTooltip(...)` on the `circleMarker`

- [x] Task 2: Pass `tripId` from TripDetailComponent to TripMapComponent (AC: #3)
  - [x] In `trip-detail.component.html`: change `<app-trip-map></app-trip-map>` to `<app-trip-map [tripId]="tripId"></app-trip-map>`

- [x] Task 3: Update spec mock and add unit tests (AC: #1, #2)
  - [x] In `trip-map.component.spec.ts`: add `bindPopup: vi.fn().mockReturnThis()` to `mockMarker` in the `vi.mock('leaflet', ...)` factory
  - [x] Test: `should bind popup to markers when steps have coordinates` — assert `circleMarker(...).bindPopup` was called (via `vi.mocked` on the returned mock)
  - [x] Test: `should include step name in popup HTML` — spy on `buildPopupHtml` or assert `bindPopup` was called with HTML containing the step name

### Review Findings

- [x] [Review][Patch] "View in trip" link branch untested — `tripId` is never set on the `TripMapComponent` under test, so `buildPopupHtml` always takes the no-link branch; AC #3 link presence is unverified [`trip-map.component.spec.ts`]
- [x] [Review][Defer] XSS: step fields (`name`, `date`, `startTime`) injected raw into Leaflet popup HTML without sanitization [`trip-map.component.ts:buildPopupHtml`] — deferred, v1 personal-project; step data validated server-side; address with DOMPurify or Content Security Policy before multi-user/public launch
- [x] [Review][Defer] Popup HTML not reactive to `tripId` input changes after initial bind — Leaflet bakes the HTML string at `bindPopup()` call time; if `tripId` ever changes post-init, existing popups show stale link [`trip-map.component.ts:buildPopupHtml`] — deferred, pre-existing; `tripId` is set once in `ngOnInit` and never changes in current routing

## Dev Notes

### Scope: Minimal Changes — Two Files

- **Modified:** `rollplan-client/src/app/map/trip-map/trip-map.component.ts` (+`Input`, `tripId` field, `buildPopupHtml` method, `.bindPopup()` call)
- **Modified:** `rollplan-client/src/app/trips/trip-detail/trip-detail.component.html` (add `[tripId]="tripId"`)
- **Modified:** `rollplan-client/src/app/map/trip-map/trip-map.component.spec.ts` (mock + tests)

No new components, no backend changes, no routing changes.

### Current TripMapComponent State

The component is at `rollplan-client/src/app/map/trip-map/trip-map.component.ts`. Current imports:

```typescript
import { Component, AfterViewInit, OnDestroy, ViewChild, ElementRef, inject, signal, effect } from '@angular/core';
```

Add `Input` to this import. The `circleMarker` chain currently reads:

```typescript
L.circleMarker(latlng, { radius: 8, fillColor: '#0ea5e9', color: '#fff', weight: 2, fillOpacity: 0.9 })
  .bindTooltip(`${step.sortOrder}. ${step.name}`)
  .addTo(this.markersLayer);
```

### Exact Changes to `trip-map.component.ts`

**1. Import — add `Input`:**
```typescript
import { Component, AfterViewInit, OnDestroy, ViewChild, ElementRef, inject, signal, effect, Input } from '@angular/core';
```

**2. New field (after `readonly mapEmpty = signal(true)`):**
```typescript
@Input() tripId = '';
```

**3. Updated `circleMarker` chain in `updateMarkers()`:**
```typescript
L.circleMarker(latlng, { radius: 8, fillColor: '#0ea5e9', color: '#fff', weight: 2, fillOpacity: 0.9 })
  .bindTooltip(`${step.sortOrder}. ${step.name}`)
  .bindPopup(this.buildPopupHtml(step))
  .addTo(this.markersLayer);
```

**4. New private method (add after `updateMarkers`):**
```typescript
private buildPopupHtml(step: Step): string {
  const parts: string[] = [
    `<strong>${step.name}</strong>`,
    `<span>${step.type}</span>`
  ];
  if (step.date) parts.push(`<span>${step.date}</span>`);
  if (step.startTime) parts.push(`<span>${step.startTime}</span>`);
  if (this.tripId) {
    parts.push(`<a href="/trips/${this.tripId}" style="display:block;margin-top:6px;font-size:0.8rem">View in trip</a>`);
  }
  return `<div style="min-width:150px">${parts.join('<br/>')}</div>`;
}
```

### Why `bindPopup` (Not Custom Angular Component)

Leaflet popup content is injected as a raw HTML string into the map's DOM — it is NOT an Angular template. Using Angular components inside Leaflet popups requires dynamic component creation with `ApplicationRef.attachView()`, which is complex and out of scope. `buildPopupHtml()` returns a plain HTML string, which is correct for Leaflet's `bindPopup()` API.

### Why Coexist: `bindTooltip` + `bindPopup`

Both can be chained on the same marker:
- `bindTooltip`: shows on hover (step sortOrder + name, e.g. "1. Eiffel Tower") — story 4.1
- `bindPopup`: opens on click (name, type, date, time, link) — this story

Leaflet handles them independently. No conflict.

### AC #2 — Popup Close on Outside Click

Leaflet's `bindPopup()` handles this natively. Clicking on the map canvas (outside any popup) fires a `click` event on the map which closes the open popup. No extra code required.

### AC #3 — "View in Trip" Link

The trip detail page is at `/trips/{tripId}` and the user is already on it. The link navigates to the same page, effectively doing nothing visible but satisfying the spec's requirement for a link. A future story can add `#step-{stepId}` anchor scrolling by adding `id="step-{{step.id}}"` to step cards in `step-list.component.html`.

The link is only included in the popup HTML when `this.tripId` is non-empty (safe-guard against the component being used without the input).

### TripDetailComponent Template Change

Current:
```html
<app-trip-map></app-trip-map>
```

New:
```html
<app-trip-map [tripId]="tripId"></app-trip-map>
```

`tripId` is a `string` field set in `TripDetailComponent.ngOnInit` from the route param: `this.tripId = this.route.snapshot.paramMap.get('id')!;`. No type mismatch.

### Step Interface (from `step.service.ts`)

```typescript
export interface Step {
  id: string;
  tripId: string;
  name: string;
  type: StepType;         // 'Travel' | 'Accommodation' | 'Activity' | 'Meal' | 'Rest'
  location?: string;
  latitude?: number;
  longitude?: number;
  date?: string;          // optional — show in popup if truthy
  startTime?: string;     // optional — show in popup if truthy
  sortOrder: number;
  note?: string;
  createdAt: string;
  updatedAt: string;
}
```

### Leaflet Mock — Required Addition for Spec

Add `bindPopup` to `mockMarker` in `vi.mock('leaflet', ...)`:

```typescript
const mockMarker = {
  bindTooltip: vi.fn().mockReturnThis(),
  bindPopup: vi.fn().mockReturnThis(),   // ← ADD
  addTo: vi.fn().mockReturnThis()
};
```

### Test Fixture — Step with Date/Time

Add a fixture for a step with date and time to test popup HTML content:

```typescript
const stepWithCoordsAndDate: Step = {
  id: 'aaaa-0004',
  tripId: 'bbbb-0001',
  name: 'Ferry Crossing',
  type: 'Travel',
  sortOrder: 2,
  latitude: 49.0,
  longitude: 2.5,
  date: '2026-05-10',
  startTime: '14:00',
  createdAt: '2026-05-01T00:00:00Z',
  updatedAt: '2026-05-01T00:00:00Z'
};
```

### Test Strategy

The simplest assertion for popup content is to check that `bindPopup` was called and inspect what it was called with:

```typescript
it('should bind popup to markers when steps have coordinates', () => {
  stepsSignal.set([stepWithCoords]);
  const fixture = TestBed.createComponent(TripMapComponent);
  fixture.detectChanges();
  expect(vi.mocked(L.circleMarker)).toHaveBeenCalled();
  const markerMock = vi.mocked(L.circleMarker).mock.results[0].value;
  expect(markerMock.bindPopup).toHaveBeenCalledTimes(1);
});

it('should include step name and type in popup HTML', () => {
  stepsSignal.set([stepWithCoordsAndDate]);
  const fixture = TestBed.createComponent(TripMapComponent);
  fixture.detectChanges();
  const markerMock = vi.mocked(L.circleMarker).mock.results[0].value;
  const html: string = markerMock.bindPopup.mock.calls[0][0];
  expect(html).toContain('Ferry Crossing');
  expect(html).toContain('Travel');
  expect(html).toContain('2026-05-10');
  expect(html).toContain('14:00');
});
```

**Note on mock results:** `vi.mocked(L.circleMarker).mock.results[0].value` gives the mock marker instance returned by the first call to `L.circleMarker`. Since the mock factory returns the same `mockMarker` object every time, this is the `mockMarker`. The `bindPopup` call count should be cleared in `beforeEach` — add `vi.mocked(L.circleMarker).mockClear()` and a manual reset of `mockMarker.bindPopup.mock.calls` in `beforeEach`.

**Simpler alternative** — access the mock directly via the closure. Since `mockMarker` is not exported from the mock factory, the cleanest approach is to access it via `vi.mocked(L.circleMarker).mock.results[0].value` as shown above.

### No Backend Changes

This story is purely frontend. All required data (`name`, `type`, `date`, `startTime`) is already in every `StepResponse` from `GET /api/v1/trips/{tripId}/steps`.

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### File List

- `rollplan-client/src/app/map/trip-map/trip-map.component.ts` (modified)
- `rollplan-client/src/app/trips/trip-detail/trip-detail.component.html` (modified)
- `rollplan-client/src/app/map/trip-map/trip-map.component.spec.ts` (modified)

### Change Log

- Added `Input` to `@angular/core` import in `trip-map.component.ts`
- Added `@Input() tripId = ''` field to `TripMapComponent`
- Added `buildPopupHtml(step: Step): string` private method — builds HTML div with name (bold), type, optional date, optional startTime, and "View in trip" link when `tripId` is set
- Chained `.bindPopup(this.buildPopupHtml(step))` after `.bindTooltip(...)` in `updateMarkers()`; both coexist independently on each circleMarker
- In `trip-detail.component.html`: `<app-trip-map>` updated to `<app-trip-map [tripId]="tripId">` so the link resolves to the correct trip URL
- Spec refactored: `mockMarker` extracted via `vi.hoisted()` to allow `mockMarker.bindPopup.mockClear()` in `beforeEach`; `stepWithCoordsAndDate` fixture added; 2 new tests added (`should bind popup to markers when steps have coordinates`, `should include step name and type in popup HTML`)
- All 117 Angular tests pass (was 115 — 2 new)
