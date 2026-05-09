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
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTripRequest {
  name: string;
  description?: string;
  coverImage?: File;
}

export interface UpdateTripRequest {
  name: string;
  description?: string;
  coverImage?: File;
  startDate?: string;
  endDate?: string;
}

@Injectable({ providedIn: 'root' })
export class TripService {
  private readonly _trips = signal<Trip[]>([]);
  readonly trips = this._trips.asReadonly();

  private readonly _currentTrip = signal<Trip | null>(null);
  readonly currentTrip = this._currentTrip.asReadonly();

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

  getTrip(id: string): Observable<Trip> {
    return this.http
      .get<Trip>(`${API_BASE_URL}/trips/${id}`)
      .pipe(tap(trip => this._currentTrip.set(trip)));
  }

  setTripStatus(id: string, status: TripStatus): Observable<Trip> {
    return this.http
      .patch<Trip>(`${API_BASE_URL}/trips/${id}/status`, { status })
      .pipe(tap(trip => {
        this._currentTrip.set(trip);
        this._trips.update(list => list.map(t => t.id === id ? trip : t));
      }));
  }

  updateTrip(id: string, request: UpdateTripRequest): Observable<Trip> {
    const formData = new FormData();
    formData.append('name', request.name);
    if (request.description) formData.append('description', request.description);
    if (request.coverImage) formData.append('coverImage', request.coverImage);
    if (request.startDate) formData.append('startDate', request.startDate);
    if (request.endDate) formData.append('endDate', request.endDate);

    return this.http
      .put<Trip>(`${API_BASE_URL}/trips/${id}`, formData)
      .pipe(tap(trip => {
        this._currentTrip.set(trip);
        this._trips.update(list => list.map(t => t.id === id ? trip : t));
      }));
  }

  deleteTrip(id: string): Observable<void> {
    return this.http
      .delete<void>(`${API_BASE_URL}/trips/${id}`)
      .pipe(tap(() => {
        this._trips.update(list => list.filter(t => t.id !== id));
        this._currentTrip.set(null);
      }));
  }
}
