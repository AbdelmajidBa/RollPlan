import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TripService } from '../services/trip.service';

@Component({
  selector: 'app-trip-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './trip-list.component.html'
})
export class TripListComponent implements OnInit {
  private readonly tripService = inject(TripService);
  readonly trips = this.tripService.trips;
  isLoading = signal(true);

  ngOnInit(): void {
    this.tripService.getTrips().subscribe({
      next: () => this.isLoading.set(false),
      error: () => this.isLoading.set(false)
    });
  }
}
