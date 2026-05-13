import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { API_BASE_URL } from '../../core/config/api.config';

export type StepType = 'Travel' | 'Accommodation' | 'Activity' | 'Meal' | 'Rest';

export interface Step {
  id: string;
  tripId: string;
  name: string;
  type: StepType;
  location?: string;
  latitude?: number;
  longitude?: number;
  date?: string;
  startTime?: string;
  sortOrder: number;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStepRequest {
  name: string;
  type: StepType;
  location?: string;
  latitude?: number;
  longitude?: number;
  date?: string;
  startTime?: string;
  note?: string;
}

export interface UpdateStepRequest {
  name: string;
  type: StepType;
  location?: string;
  latitude?: number;
  longitude?: number;
  date?: string;
  startTime?: string;
  note?: string;
}

@Injectable({ providedIn: 'root' })
export class StepService {
  private readonly _steps = signal<Step[]>([]);
  readonly steps = this._steps.asReadonly();

  constructor(private http: HttpClient) {}

  getSteps(tripId: string): Observable<Step[]> {
    this._steps.set([]);
    return this.http
      .get<Step[]>(`${API_BASE_URL}/trips/${tripId}/steps`)
      .pipe(tap(steps => this._steps.set(steps)));
  }

  addStep(tripId: string, request: CreateStepRequest): Observable<Step> {
    return this.http
      .post<Step>(`${API_BASE_URL}/trips/${tripId}/steps`, request)
      .pipe(tap(step => this._steps.update(list => [...list, step])));
  }

  updateStep(tripId: string, stepId: string, request: UpdateStepRequest): Observable<Step> {
    return this.http
      .put<Step>(`${API_BASE_URL}/trips/${tripId}/steps/${stepId}`, request)
      .pipe(tap(updated => this._steps.update(list => list.map(s => s.id === stepId ? updated : s))));
  }

  deleteStep(tripId: string, stepId: string): Observable<void> {
    return this.http
      .delete<void>(`${API_BASE_URL}/trips/${tripId}/steps/${stepId}`)
      .pipe(tap(() => this._steps.update(list => list.filter(s => s.id !== stepId))));
  }

  reorderSteps(tripId: string, stepIds: string[]): Observable<Step[]> {
    const snapshot = this._steps();
    const optimistic = stepIds
      .map((id, i) => { const s = snapshot.find(st => st.id === id); return s ? { ...s, sortOrder: i + 1 } : null; })
      .filter((s): s is Step => s !== null);
    this._steps.set(optimistic);

    return this.http
      .put<Step[]>(`${API_BASE_URL}/trips/${tripId}/steps/reorder`, { stepIds })
      .pipe(
        tap(updated => this._steps.set(updated)),
        catchError(err => {
          this._steps.set(snapshot);
          return throwError(() => err);
        })
      );
  }
}
