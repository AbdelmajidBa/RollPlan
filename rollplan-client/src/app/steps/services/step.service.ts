import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { API_BASE_URL } from '../../core/config/api.config';

export type StepType = 'Travel' | 'Accommodation' | 'Activity' | 'Meal' | 'Rest';

export interface Step {
  id: string;
  tripId: string;
  name: string;
  type: StepType;
  location?: string;
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
  date?: string;
  startTime?: string;
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
}
