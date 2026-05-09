import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { API_BASE_URL } from '../../core/config/api.config';

export type TripStatus = 'Planning' | 'Active' | 'Completed' | 'Archived';

export interface Trip {
  id: string;
  name: string;
  description?: string;
  status: TripStatus;
  coverImageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTripRequest {
  name: string;
  description?: string;
  coverImage?: File;
}

@Injectable({ providedIn: 'root' })
export class TripService {
  private readonly _trips = signal<Trip[]>([]);
  readonly trips = this._trips.asReadonly();

  constructor(private http: HttpClient) {}

  createTrip(request: CreateTripRequest): Observable<Trip> {
    const formData = new FormData();
    formData.append('name', request.name);
    if (request.description) {
      formData.append('description', request.description);
    }
    if (request.coverImage) {
      formData.append('coverImage', request.coverImage);
    }

    return this.http
      .post<Trip>(`${API_BASE_URL}/trips`, formData)
      .pipe(tap(trip => this._trips.update(list => [trip, ...list])));
  }

  getTrips(): Observable<Trip[]> {
    return this.http
      .get<Trip[]>(`${API_BASE_URL}/trips`)
      .pipe(tap(trips => this._trips.set(trips)));
  }
}
