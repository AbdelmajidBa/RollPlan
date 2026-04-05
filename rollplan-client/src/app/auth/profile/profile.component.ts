import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.component.html'
})
export class ProfileComponent implements OnInit {
  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  readonly serverError = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  readonly form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService
  ) {
    this.form = this.fb.group({
      displayName: ['', [Validators.required, Validators.maxLength(100)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]]
    });
  }

  get displayNameControl() { return this.form.get('displayName')!; }
  get emailControl() { return this.form.get('email')!; }

  ngOnInit(): void {
    this.isLoading.set(true);
    this.authService.getProfile().pipe(
      finalize(() => this.isLoading.set(false))
    ).subscribe({
      next: (profile) => this.form.patchValue({ displayName: profile.displayName, email: profile.email }),
      error: () => this.serverError.set('Failed to load profile.')
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.isSaving()) return;

    this.isSaving.set(true);
    this.serverError.set(null);
    this.successMessage.set(null);

    const { displayName, email } = this.form.value;

    this.authService.updateProfile(displayName, email).pipe(
      finalize(() => this.isSaving.set(false))
    ).subscribe({
      next: () => this.successMessage.set('Profile updated successfully.'),
      error: (err) => this.serverError.set(err.error?.detail ?? 'Failed to update profile.')
    });
  }
}
