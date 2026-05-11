# Story 4.4: Toggle Between Map and List View

Status: ready-for-dev

## Story

As an **authenticated user**,
I want to toggle between the map view and the step list view,
So that I can choose the most useful way to review my trip.

## Acceptance Criteria

1. **Given** an authenticated user on the trip detail page in view mode
   **When** they tap the "Map" toggle button
   **Then** the map is shown, the step list is hidden, and the "Map" button is visually active

2. **Given** an authenticated user on the trip detail page in view mode
   **When** they tap the "List" toggle button
   **Then** the step list is shown, the map is hidden, and the "List" button is visually active

3. **Given** the user has switched to the map view
   **When** they navigate away and return to the trip detail page in the same browser session
   **Then** the map view is restored (state persists via `sessionStorage`)

## Tasks / Subtasks

- [ ] Task 1: Add `activeView` signal and `setView()` to TripDetailComponent (AC: #1, #2, #3)
  - [ ] Add `activeView = signal<'list' | 'map'>('list')` field to `TripDetailComponent`
  - [ ] In `ngOnInit`: read `sessionStorage.getItem('tripDetailView')` and if the value is `'map'`, call `this.activeView.set('map')`
  - [ ] Add `setView(view: 'list' | 'map'): void` method: `this.activeView.set(view); sessionStorage.setItem('tripDetailView', view);`

- [ ] Task 2: Add toggle UI and conditional rendering to the template (AC: #1, #2)
  - [ ] In `trip-detail.component.html`, inside `<ng-container *ngIf="!isEditing()">`, add a two-button toggle group (List / Map) after the trip info card and before the child components
  - [ ] Change `<app-step-list [tripId]="tripId">` to `<app-step-list *ngIf="activeView() === 'list'" [tripId]="tripId">`
  - [ ] Change `<app-trip-map [tripId]="tripId">` to `<app-trip-map *ngIf="activeView() === 'map'" [tripId]="tripId">`

- [ ] Task 3: Add unit tests (AC: #1, #2, #3)
  - [ ] In `trip-detail.component.spec.ts`: add `sessionStorage.clear()` to `beforeEach`
  - [ ] Test: `should default to list view` — `activeView()` is `'list'` on create
  - [ ] Test: `should switch to map view when setView called` — `activeView()` is `'map'` after `setView('map')`
  - [ ] Test: `should persist view selection to sessionStorage` — after `setView('map')`, `sessionStorage.getItem('tripDetailView')` is `'map'`
  - [ ] Test: `should restore map view from sessionStorage on init` — set `sessionStorage.setItem('tripDetailView', 'map')` before `detectChanges()`, then assert `activeView() === 'map'`

## Dev Notes

### Scope: One Component — TripDetailComponent

- **Modified:** `rollplan-client/src/app/trips/trip-detail/trip-detail.component.ts` (+`activeView` signal, `setView()` method, sessionStorage read in `ngOnInit`)
- **Modified:** `rollplan-client/src/app/trips/trip-detail/trip-detail.component.html` (toggle buttons, `*ngIf` on child components)
- **Modified:** `rollplan-client/src/app/trips/trip-detail/trip-detail.component.spec.ts` (sessionStorage.clear + 4 new tests)

No new components. No backend changes. `TripMapComponent` and `StepListComponent` are unchanged.

### Current TripDetailComponent State

File: `rollplan-client/src/app/trips/trip-detail/trip-detail.component.ts`

Current imports and signals:
```typescript
import { Component, OnInit, inject, signal } from '@angular/core';
// ...
readonly trip = this.tripService.currentTrip;
isLoading = signal(true);
isEditing = signal(false);
// ... other signals
tripId = '';
```

Current `ngOnInit`:
```typescript
ngOnInit(): void {
  this.tripId = this.route.snapshot.paramMap.get('id')!;
  this.tripService.getTrip(this.tripId).subscribe({
    next: () => { this.initForm(); this.isLoading.set(false); },
    error: () => this.isLoading.set(false)
  });
}
```

### Exact Changes to `trip-detail.component.ts`

**1. New field (after `tripId = ''`):**
```typescript
tripId = '';
activeView = signal<'list' | 'map'>('list');
```

**2. Updated `ngOnInit` — add sessionStorage read:**
```typescript
ngOnInit(): void {
  this.tripId = this.route.snapshot.paramMap.get('id')!;
  if (sessionStorage.getItem('tripDetailView') === 'map') {
    this.activeView.set('map');
  }
  this.tripService.getTrip(this.tripId).subscribe({
    next: () => { this.initForm(); this.isLoading.set(false); },
    error: () => this.isLoading.set(false)
  });
}
```

**3. New method (add after `cancelEditing`):**
```typescript
setView(view: 'list' | 'map'): void {
  this.activeView.set(view);
  sessionStorage.setItem('tripDetailView', view);
}
```

### Exact Changes to `trip-detail.component.html`

Current view-mode section (line ~91–93):
```html
        <app-step-list [tripId]="tripId"></app-step-list>
        <app-trip-map [tripId]="tripId"></app-trip-map>
```

Replace with:
```html
        <div class="mt-6 flex gap-2">
          <button
            (click)="setView('list')"
            [class.bg-sky-600]="activeView() === 'list'"
            [class.text-white]="activeView() === 'list'"
            [class.bg-slate-800]="activeView() !== 'list'"
            [class.text-slate-400]="activeView() !== 'list'"
            class="rounded-2xl px-4 py-2 text-sm font-semibold transition hover:text-white"
          >
            List
          </button>
          <button
            (click)="setView('map')"
            [class.bg-sky-600]="activeView() === 'map'"
            [class.text-white]="activeView() === 'map'"
            [class.bg-slate-800]="activeView() !== 'map'"
            [class.text-slate-400]="activeView() !== 'map'"
            class="rounded-2xl px-4 py-2 text-sm font-semibold transition hover:text-white"
          >
            Map
          </button>
        </div>

        <app-step-list *ngIf="activeView() === 'list'" [tripId]="tripId"></app-step-list>
        <app-trip-map *ngIf="activeView() === 'map'" [tripId]="tripId"></app-trip-map>
```

### Why `*ngIf` Not `[hidden]`

`*ngIf` destroys/recreates child components on each toggle. This is preferred because:
- `TripMapComponent` uses `ngAfterViewInit` to initialize Leaflet; if kept in DOM hidden, `invalidateSize()` must be called on reveal (requires public method + `@ViewChild` — unnecessary complexity)
- `StepListComponent` reads from the `StepService` steps signal, which persists across recreations — no extra HTTP calls
- `TripMapComponent` reads from the same signal — the map renders instantly on recreation from already-loaded data

### Why `sessionStorage` Not `localStorage`

The spec says "persists during the session." `sessionStorage` is tab-local and cleared on tab close — exactly the right semantic. `localStorage` would persist across browser restarts, which is beyond the spec scope.

### SessionStorage Key: `'tripDetailView'`

A single key (not trip-specific) is correct. The user's viewing preference for map vs list applies across all trip detail pages, not per-trip.

### Toggle Placement

The toggle appears after the trip info card (`</div>` at line ~89) and before the child components. It is only visible in view mode (inside `<ng-container *ngIf="!isEditing()">`), which is correct — editing mode shows the edit form, not the list or map.

### Existing Spec File Structure

`trip-detail.component.spec.ts` already has (147 lines):
- `mockTrip` fixture
- `TripService` stub with `getTripSpy`, `updateTripSpy`, `setTripStatusSpy`, `currentTripSignal`
- 8 existing tests (create, getTrip on init, loading states, edit form, trip name, status select, confirm dialog, updateTrip)
- TestBed setup with `provideRouter([])`, `TripService`, `ActivatedRoute` stubs

Add `sessionStorage.clear()` in `beforeEach` **before** `TestBed.configureTestingModule`. This prevents stale sessionStorage state leaking between tests.

### Exact Test Additions for `trip-detail.component.spec.ts`

**Add to `beforeEach` (before the `await TestBed...` block):**
```typescript
sessionStorage.clear();
```

**Add 4 new tests (inside `describe` block, after existing tests):**
```typescript
it('should default to list view', () => {
  getTripSpy.mockReturnValue(of(mockTrip));
  const fixture = TestBed.createComponent(TripDetailComponent);
  expect(fixture.componentInstance.activeView()).toBe('list');
});

it('should switch to map view when setView called', () => {
  getTripSpy.mockReturnValue(of(mockTrip));
  const fixture = TestBed.createComponent(TripDetailComponent);
  fixture.componentInstance.setView('map');
  expect(fixture.componentInstance.activeView()).toBe('map');
});

it('should persist view selection to sessionStorage', () => {
  getTripSpy.mockReturnValue(of(mockTrip));
  const fixture = TestBed.createComponent(TripDetailComponent);
  fixture.componentInstance.setView('map');
  expect(sessionStorage.getItem('tripDetailView')).toBe('map');
});

it('should restore map view from sessionStorage on init', () => {
  sessionStorage.setItem('tripDetailView', 'map');
  getTripSpy.mockReturnValue(of(mockTrip));
  const fixture = TestBed.createComponent(TripDetailComponent);
  fixture.detectChanges();
  expect(fixture.componentInstance.activeView()).toBe('map');
});
```

**Note:** `sessionStorage` is available in vitest/jsdom environment. No mocking required — jsdom provides a real (in-memory) sessionStorage implementation. Clearing in `beforeEach` ensures test isolation.

**Note:** The `should restore map view from sessionStorage on init` test sets `sessionStorage` BEFORE `detectChanges()` (which triggers `ngOnInit`) — this is the correct order.

### No Backend Changes

Purely frontend — no new API endpoints, no new services. `activeView` is local component state + `sessionStorage`.

### Anti-Patterns to Avoid

- **Do NOT** create a new service for view state — it's local to the component
- **Do NOT** use `[hidden]` on child components — see "Why *ngIf Not [hidden]" above
- **Do NOT** use `localStorage` — session scope is correct per spec
- **Do NOT** add the toggle in edit mode — keep it inside `<ng-container *ngIf="!isEditing()">`

## Dev Agent Record

### Agent Model Used

(to be filled)

### File List

- `rollplan-client/src/app/trips/trip-detail/trip-detail.component.ts` (modified)
- `rollplan-client/src/app/trips/trip-detail/trip-detail.component.html` (modified)
- `rollplan-client/src/app/trips/trip-detail/trip-detail.component.spec.ts` (modified)

### Change Log

(to be filled)
