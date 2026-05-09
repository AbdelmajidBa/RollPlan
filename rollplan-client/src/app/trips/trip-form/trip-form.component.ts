import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { TripService } from '../services/trip.service';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png'];

@Component({
  selector: 'app-trip-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './trip-form.component.html'
})
export class TripFormComponent {
  readonly isSubmitting = signal(false);
  readonly serverError = signal<string | null>(null);
  readonly fileError = signal<string | null>(null);

  readonly form: FormGroup;
  private selectedFile: File | null = null;

  constructor(
    private fb: FormBuilder,
    private tripService: TripService,
    private router: Router
  ) {
    this.form = this.fb.group({
      name: ['', [Validators.required]],
      description: ['']
    });
  }

  get nameControl() { return this.form.get('name')!; }

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

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.isSubmitting()) return;

    this.isSubmitting.set(true);
    this.serverError.set(null);

    const { name, description } = this.form.value;

    this.tripService.createTrip({
      name,
      description: description || undefined,
      coverImage: this.selectedFile ?? undefined
    }).pipe(
      finalize(() => this.isSubmitting.set(false))
    ).subscribe({
      next: (trip) => this.router.navigate(['/trips', trip.id]),
      error: (err) => this.serverError.set(err.error?.detail ?? 'Failed to create trip.')
    });
  }
}
