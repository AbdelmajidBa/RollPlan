import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { TripListComponent } from './trip-list.component';
import { TripService, Trip } from '../services/trip.service';

const mockTrip: Trip = {
  id: '22222222-2222-2222-2222-222222222222',
  name: 'Paris Trip',
  status: 'Planning',
  createdAt: '2026-05-09T10:00:00Z',
  updatedAt: '2026-05-09T10:00:00Z'
};

describe('TripListComponent', () => {
  let getTripsSpy: ReturnType<typeof vi.fn>;
  let tripsSignal: ReturnType<typeof signal<Trip[]>>;

  beforeEach(async () => {
    getTripsSpy = vi.fn();
    tripsSignal = signal<Trip[]>([]);

    const tripServiceStub = {
      trips: tripsSignal.asReadonly(),
      getTrips: getTripsSpy,
      createTrip: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [TripListComponent],
      providers: [
        provideRouter([{ path: 'trips/create', component: TripListComponent }]),
        { provide: TripService, useValue: tripServiceStub }
      ]
    }).compileComponents();
  });

  it('should create', () => {
    getTripsSpy.mockReturnValue(of([]));
    const fixture = TestBed.createComponent(TripListComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should expose trips from TripService', () => {
    getTripsSpy.mockReturnValue(of([]));
    const fixture = TestBed.createComponent(TripListComponent);
    const tripService = TestBed.inject(TripService);
    expect(fixture.componentInstance.trips).toBe(tripService.trips);
  });

  it('should render Create New Trip link', () => {
    getTripsSpy.mockReturnValue(of([]));
    const fixture = TestBed.createComponent(TripListComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const link = compiled.querySelector('a[routerLink]');
    expect(link).toBeTruthy();
  });

  it('should call getTrips on init', () => {
    getTripsSpy.mockReturnValue(of([]));
    const fixture = TestBed.createComponent(TripListComponent);
    fixture.detectChanges();
    expect(getTripsSpy).toHaveBeenCalledTimes(1);
  });

  it('should render trip cards with routerLink to /trips/:id after loading', () => {
    tripsSignal.set([mockTrip]);
    getTripsSpy.mockReturnValue(of([mockTrip]));
    const fixture = TestBed.createComponent(TripListComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const card = compiled.querySelector(`a[href="/trips/${mockTrip.id}"]`);
    expect(card).toBeTruthy();
  });

  it('should show loading initially and hide it after response', () => {
    getTripsSpy.mockReturnValue(of([]));
    const fixture = TestBed.createComponent(TripListComponent);
    expect(fixture.componentInstance.isLoading()).toBe(true);
    fixture.detectChanges();
    expect(fixture.componentInstance.isLoading()).toBe(false);
  });
});
