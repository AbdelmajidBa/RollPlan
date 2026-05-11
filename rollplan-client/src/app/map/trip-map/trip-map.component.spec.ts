import { vi } from 'vitest';

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
});
