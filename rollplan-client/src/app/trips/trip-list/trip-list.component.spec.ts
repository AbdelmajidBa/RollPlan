import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { TripListComponent } from './trip-list.component';
import { TripService } from '../services/trip.service';

describe('TripListComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TripListComponent],
      providers: [
        provideRouter([{ path: 'trips/create', component: TripListComponent }]),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(TripListComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should expose trips from TripService', () => {
    const fixture = TestBed.createComponent(TripListComponent);
    const tripService = TestBed.inject(TripService);
    expect(fixture.componentInstance.trips).toBe(tripService.trips);
  });

  it('should render Create New Trip link', () => {
    const fixture = TestBed.createComponent(TripListComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const link = compiled.querySelector('a[routerLink]');
    expect(link).toBeTruthy();
  });
});
