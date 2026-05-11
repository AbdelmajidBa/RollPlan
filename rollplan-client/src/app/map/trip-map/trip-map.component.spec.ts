import { vi } from 'vitest';

const mockMarker = vi.hoisted(() => ({
  bindTooltip: vi.fn().mockReturnThis(),
  bindPopup: vi.fn().mockReturnThis(),
  addTo: vi.fn().mockReturnThis()
}));

vi.mock('leaflet', () => {
  const mockLayer = { addTo: vi.fn().mockReturnThis(), clearLayers: vi.fn() };
  const mockMap = {
    setView: vi.fn().mockReturnThis(),
    addLayer: vi.fn(),
    fitBounds: vi.fn(),
    invalidateSize: vi.fn(),
    remove: vi.fn()
  };
  const mockPolyline = { addTo: vi.fn().mockReturnThis(), remove: vi.fn() };
  return {
    map: vi.fn(() => mockMap),
    tileLayer: vi.fn(() => ({ addTo: vi.fn() })),
    layerGroup: vi.fn(() => mockLayer),
    circleMarker: vi.fn(() => mockMarker),
    latLngBounds: vi.fn(() => ({})),
    polyline: vi.fn(() => mockPolyline)
  };
});

import * as L from 'leaflet';
import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { TripMapComponent } from './trip-map.component';
import { StepService, Step } from '../../steps/services/step.service';

const stepWithCoords: Step = {
  id: 'aaaa-0001',
  tripId: 'bbbb-0001',
  name: 'Eiffel Tower',
  type: 'Activity',
  sortOrder: 1,
  latitude: 48.8566,
  longitude: 2.3522,
  createdAt: '2026-05-01T00:00:00Z',
  updatedAt: '2026-05-01T00:00:00Z'
};

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

const stepNoCoords: Step = {
  id: 'aaaa-0002',
  tripId: 'bbbb-0001',
  name: 'Hotel Check-in',
  type: 'Accommodation',
  sortOrder: 2,
  createdAt: '2026-05-01T00:00:00Z',
  updatedAt: '2026-05-01T00:00:00Z'
};

describe('TripMapComponent', () => {
  let stepsSignal: ReturnType<typeof signal<Step[]>>;

  beforeEach(async () => {
    stepsSignal = signal<Step[]>([]);
    vi.mocked(L.polyline).mockClear();
    vi.mocked(L.circleMarker).mockClear();
    mockMarker.bindPopup.mockClear();

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

  it('should set mapEmpty to true when steps array is empty', () => {
    stepsSignal.set([]);
    const fixture = TestBed.createComponent(TripMapComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.mapEmpty()).toBe(true);
  });

  it('should draw polyline when 2+ steps have coordinates', () => {
    stepsSignal.set([stepWithCoords, stepWithCoords2, stepNoCoords]);
    const fixture = TestBed.createComponent(TripMapComponent);
    fixture.detectChanges();
    expect(vi.mocked(L.polyline)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(L.polyline)).toHaveBeenCalledWith(
      [[48.8566, 2.3522], [48.8606, 2.3376]],
      { color: '#0ea5e9', weight: 3, opacity: 0.6 }
    );
  });

  it('should not draw polyline when fewer than 2 steps have coordinates', () => {
    stepsSignal.set([stepWithCoords, stepNoCoords]);
    const fixture = TestBed.createComponent(TripMapComponent);
    fixture.detectChanges();
    expect(vi.mocked(L.polyline)).not.toHaveBeenCalled();
  });

  it('should bind popup to markers when steps have coordinates', () => {
    stepsSignal.set([stepWithCoords]);
    const fixture = TestBed.createComponent(TripMapComponent);
    fixture.detectChanges();
    expect(vi.mocked(L.circleMarker)).toHaveBeenCalled();
    expect(mockMarker.bindPopup).toHaveBeenCalledTimes(1);
  });

  it('should include step name and type in popup HTML', () => {
    stepsSignal.set([stepWithCoordsAndDate]);
    const fixture = TestBed.createComponent(TripMapComponent);
    fixture.detectChanges();
    const html: string = mockMarker.bindPopup.mock.calls[0][0];
    expect(html).toContain('Ferry Crossing');
    expect(html).toContain('Travel');
    expect(html).toContain('2026-05-10');
    expect(html).toContain('14:00');
  });
});
