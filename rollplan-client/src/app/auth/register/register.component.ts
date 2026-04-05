import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html'
})
export class RegisterComponent {
  readonly isLoading = signal(false);
  readonly serverError = signal<string | null>(null);

  readonly form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  get emailControl() { return this.form.get('email')!; }
  get passwordControl() { return this.form.get('password')!; }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.isLoading()) return; // guard against double-submit

    this.isLoading.set(true);
    this.serverError.set(null);

    const { email, password } = this.form.value;

    this.authService.register(email, password).pipe(
      finalize(() => this.isLoading.set(false))
    ).subscribe({
      next: () => this.router.navigate(['/trips']),
      error: (err) => {
        this.serverError.set(
          err.error?.detail ?? 'Registration failed. Please try again.'
        );
      }
    });
  }
}
