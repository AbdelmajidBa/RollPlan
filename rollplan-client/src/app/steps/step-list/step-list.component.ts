import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { StepService, StepType } from '../services/step.service';

@Component({
  selector: 'app-step-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './step-list.component.html'
})
export class StepListComponent implements OnInit {
  @Input() tripId!: string;

  private readonly stepService = inject(StepService);
  private readonly fb = inject(FormBuilder);

  readonly steps = this.stepService.steps;
  readonly stepTypes: StepType[] = ['Travel', 'Accommodation', 'Activity', 'Meal', 'Rest'];

  isLoading = signal(true);
  showAddForm = signal(false);
  isSubmitting = signal(false);
  formError = signal<string | null>(null);

  readonly form: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(200)]],
    type: ['', Validators.required],
    location: [''],
    date: [''],
    startTime: ['']
  });

  get nameControl() { return this.form.get('name')!; }
  get typeControl() { return this.form.get('type')!; }

  ngOnInit(): void {
    this.stepService.getSteps(this.tripId).subscribe({
      next: () => this.isLoading.set(false),
      error: () => this.isLoading.set(false)
    });
  }

  toggleAddForm(): void {
    this.showAddForm.update(v => !v);
    if (!this.showAddForm()) {
      this.form.reset();
      this.formError.set(null);
    }
  }

  cancelAdd(): void {
    this.showAddForm.set(false);
    this.form.reset();
    this.formError.set(null);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.isSubmitting()) return;

    this.isSubmitting.set(true);
    this.formError.set(null);

    const { name, type, location, date, startTime } = this.form.value;

    this.stepService.addStep(this.tripId, {
      name,
      type,
      location: location?.trim() || undefined,
      date: date || undefined,
      startTime: startTime || undefined
    }).pipe(
      finalize(() => this.isSubmitting.set(false))
    ).subscribe({
      next: () => {
        this.form.reset();
        this.showAddForm.set(false);
      },
      error: (err) => {
        const detail = err.error?.detail ?? 'Failed to add step.';
        this.formError.set(detail);
      }
    });
  }

  typeBadgeClass(type: StepType): string {
    const map: Record<StepType, string> = {
      Travel: 'bg-blue-900/50 text-blue-300',
      Accommodation: 'bg-purple-900/50 text-purple-300',
      Activity: 'bg-green-900/50 text-green-300',
      Meal: 'bg-orange-900/50 text-orange-300',
      Rest: 'bg-slate-700/50 text-slate-300'
    };
    return map[type] ?? 'bg-slate-700/50 text-slate-300';
  }
}
