import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { TripDetailComponent } from './trip-detail.component';
import { TripService, Trip } from '../services/trip.service';

const mockTrip: Trip = {
  id: '33333333-3333-3333-3333-333333333333',
  name: 'Paris Trip',
  description: 'A lovely trip',
  status: 'Planning',
  createdAt: '2026-05-09T10:00:00Z',
  updatedAt: '2026-05-09T10:00:00Z'
};

describe('TripDetailComponent', () => {
  let getTripSpy: ReturnType<typeof vi.fn>;
  let updateTripSpy: ReturnType<typeof vi.fn>;
  let setTripStatusSpy: ReturnType<typeof vi.fn>;
  let currentTripSignal: ReturnType<typeof signal<Trip | null>>;

  beforeEach(async () => {
    sessionStorage.clear();
    getTripSpy = vi.fn();
    updateTripSpy = vi.fn();
    setTripStatusSpy = vi.fn();
    currentTripSignal = signal<Trip | null>(null);

    const tripServiceStub = {
      currentTrip: currentTripSignal.asReadonly(),
      getTrip: getTripSpy,
      updateTrip: updateTripSpy,
      setTripStatus: setTripStatusSpy,
      deleteTrip: vi.fn(),
      trips: signal<Trip[]>([]).asReadonly()
    };

    const activatedRouteStub = {
      snapshot: { paramMap: { get: () => mockTrip.id } }
    };

    await TestBed.configureTestingModule({
      imports: [TripDetailComponent],
      providers: [
        provideRouter([]),
        { provide: TripService, useValue: tripServiceStub },
        { provide: ActivatedRoute, useValue: activatedRouteStub }
      ]
    }).compileComponents();
  });

  it('should create', () => {
    getTripSpy.mockReturnValue(of(mockTrip));
    const fixture = TestBed.createComponent(TripDetailComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should call getTrip on init with route id', () => {
    getTripSpy.mockReturnValue(of(mockTrip));
    const fixture = TestBed.createComponent(TripDetailComponent);
    fixture.detectChanges();
    expect(getTripSpy).toHaveBeenCalledWith(mockTrip.id);
  });

  it('should show loading initially and hide after response', () => {
    getTripSpy.mockReturnValue(of(mockTrip));
    const fixture = TestBed.createComponent(TripDetailComponent);
    expect(fixture.componentInstance.isLoading()).toBe(true);
    fixture.detectChanges();
    expect(fixture.componentInstance.isLoading()).toBe(false);
  });

  it('should hide loading on error', () => {
    getTripSpy.mockReturnValue(throwError(() => new Error('Not found')));
    const fixture = TestBed.createComponent(TripDetailComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.isLoading()).toBe(false);
  });

  it('should show edit form when isEditing is true', () => {
    getTripSpy.mockReturnValue(of(mockTrip));
    currentTripSignal.set(mockTrip);
    const fixture = TestBed.createComponent(TripDetailComponent);
    fixture.detectChanges();
    fixture.componentInstance.startEditing();
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('form')).toBeTruthy();
  });

  it('should show trip name when not editing', () => {
    getTripSpy.mockReturnValue(of(mockTrip));
    currentTripSignal.set(mockTrip);
    const fixture = TestBed.createComponent(TripDetailComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain(mockTrip.name);
  });

  it('should show status select in view mode', () => {
    getTripSpy.mockReturnValue(of(mockTrip));
    currentTripSignal.set(mockTrip);
    const fixture = TestBed.createComponent(TripDetailComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const select = compiled.querySelector('select#statusSelect');
    expect(select).toBeTruthy();
  });

  it('should show confirm dialog when showConfirm is true', () => {
    getTripSpy.mockReturnValue(of(mockTrip));
    currentTripSignal.set(mockTrip);
    const fixture = TestBed.createComponent(TripDetailComponent);
    fixture.detectChanges();
    fixture.componentInstance.showConfirm.set(true);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('This will permanently delete the trip');
  });

  it('should hide confirm dialog when cancel clicked', () => {
    getTripSpy.mockReturnValue(of(mockTrip));
    currentTripSignal.set(mockTrip);
    const fixture = TestBed.createComponent(TripDetailComponent);
    fixture.detectChanges();
    fixture.componentInstance.showConfirm.set(true);
    fixture.detectChanges();
    fixture.componentInstance.cancelDelete();
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).not.toContain('This will permanently delete the trip');
  });

  it('should call updateTrip on onSubmit with valid form', () => {
    getTripSpy.mockReturnValue(of(mockTrip));
    updateTripSpy.mockReturnValue(of(mockTrip));
    currentTripSignal.set(mockTrip);
    const fixture = TestBed.createComponent(TripDetailComponent);
    fixture.detectChanges();
    fixture.componentInstance.startEditing();
    fixture.componentInstance.form.patchValue({ name: 'Updated Name' });
    fixture.componentInstance.onSubmit();
    expect(updateTripSpy).toHaveBeenCalledWith(mockTrip.id, expect.objectContaining({ name: 'Updated Name' }));
  });

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
});
