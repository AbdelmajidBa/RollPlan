import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { TripService, TripStatus } from '../services/trip.service';
import { StepListComponent } from '../../steps/step-list/step-list.component';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png'];

@Component({
  selector: 'app-trip-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, StepListComponent],
  templateUrl: './trip-detail.component.html'
})
export class TripDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly tripService = inject(TripService);
  private readonly fb = inject(FormBuilder);

  readonly trip = this.tripService.currentTrip;
  readonly statuses: TripStatus[] = ['Planning', 'Active', 'Completed', 'Archived'];
  isLoading = signal(true);
  isEditing = signal(false);
  isSubmitting = signal(false);
  isStatusChanging = signal(false);
  isDeleting = signal(false);
  showConfirm = signal(false);
  serverError = signal<string | null>(null);
  fileError = signal<string | null>(null);

  readonly form: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(200)]],
    description: [''],
    startDate: [''],
    endDate: ['']
  });

  tripId = '';
  private selectedFile: File | null = null;

  get nameControl() { return this.form.get('name')!; }

  ngOnInit(): void {
    this.tripId = this.route.snapshot.paramMap.get('id')!;
    this.tripService.getTrip(this.tripId).subscribe({
      next: () => {
        this.initForm();
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  private initForm(): void {
    const t = this.trip();
    if (!t) return;
    this.form.patchValue({
      name: t.name,
      description: t.description ?? '',
      startDate: t.startDate ? t.startDate.substring(0, 10) : '',
      endDate: t.endDate ? t.endDate.substring(0, 10) : ''
    });
  }

  startEditing(): void {
    this.initForm();
    this.selectedFile = null;
    this.fileError.set(null);
    this.serverError.set(null);
    this.isEditing.set(true);
  }

  cancelEditing(): void {
    this.isEditing.set(false);
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.fileError.set(null);

    if (!file) {
      this.selectedFile = null;
      return;
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      this.fileError.set('Only JPG and PNG files are allowed.');
      input.value = '';
      this.selectedFile = null;
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      this.fileError.set('File must not exceed 10 MB.');
      input.value = '';
      this.selectedFile = null;
      return;
    }

    this.selectedFile = file;
  }

  setStatus(status: string): void {
    if (this.isStatusChanging()) return;
    this.isStatusChanging.set(true);
    this.tripService.setTripStatus(this.tripId, status as TripStatus)
      .pipe(finalize(() => this.isStatusChanging.set(false)))
      .subscribe({
        error: () => this.serverError.set('Failed to update trip status.')
      });
  }

  confirmDelete(): void {
    this.showConfirm.set(true);
  }

  cancelDelete(): void {
    this.showConfirm.set(false);
  }

  doDelete(): void {
    if (this.isDeleting()) return;
    this.isDeleting.set(true);
    this.tripService.deleteTrip(this.tripId)
      .pipe(finalize(() => this.isDeleting.set(false)))
      .subscribe({
        next: () => this.router.navigate(['/trips']),
        error: () => this.serverError.set('Failed to delete trip. Please try again.')
      });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.fileError()) return;
    if (this.isSubmitting()) return;

    this.isSubmitting.set(true);
    this.serverError.set(null);

    const { name, description, startDate, endDate } = this.form.value;

    this.tripService.updateTrip(this.tripId, {
      name,
      description: description?.trim() ?? undefined,
      coverImage: this.selectedFile ?? undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined
    }).pipe(
      finalize(() => this.isSubmitting.set(false))
    ).subscribe({
      next: () => this.isEditing.set(false),
      error: (err) => {
        const fieldErrors = err.error?.errors;
        if (fieldErrors) {
          const nameErrors: string[] = fieldErrors['Name'] ?? fieldErrors['name'] ?? [];
          if (nameErrors.length > 0) {
            this.nameControl.setErrors({ serverError: nameErrors[0] });
          }
          const firstGeneral = Object.entries(fieldErrors as Record<string, string[]>)
            .filter(([k]) => k.toLowerCase() !== 'name')
            .flatMap(([, msgs]) => msgs)[0];
          this.serverError.set(firstGeneral ?? null);
        } else {
          this.serverError.set(err.error?.detail ?? 'Failed to update trip.');
        }
      }
    });
  }
}
