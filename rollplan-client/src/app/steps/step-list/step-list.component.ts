import { Component, Input, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { CdkDragDrop, CdkDropList, CdkDrag, CdkDragPlaceholder, moveItemInArray } from '@angular/cdk/drag-drop';
import { StepService, StepType, Step } from '../services/step.service';
import { PlacesAutocompleteDirective } from '../../shared/directives/places-autocomplete.directive';
import { PlaceSelectedEvent } from '../../core/services/places.service';

@Component({
  selector: 'app-step-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PlacesAutocompleteDirective, CdkDropList, CdkDrag, CdkDragPlaceholder],
  templateUrl: './step-list.component.html'
})
export class StepListComponent implements OnInit, OnDestroy {
  @Input() tripId!: string;

  private readonly stepService = inject(StepService);
  private readonly fb = inject(FormBuilder);

  readonly steps = this.stepService.steps;
  readonly stepTypes: StepType[] = ['Travel', 'Accommodation', 'Activity', 'Meal', 'Rest'];

  isLoading = signal(true);
  showAddForm = signal(false);
  isSubmitting = signal(false);
  formError = signal<string | null>(null);

  editingStepId = signal<string | null>(null);
  isEditSubmitting = signal(false);
  editFormError = signal<string | null>(null);

  deletingStepId = signal<string | null>(null);
  isDeletingStep = signal(false);
  deleteError = signal<string | null>(null);

  reorderError = signal<string | null>(null);

  private readonly locationSub: Subscription;
  private readonly editLocationSub: Subscription;

  readonly form: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(200)]],
    type: ['', Validators.required],
    location: [''],
    latitude: [null as number | null],
    longitude: [null as number | null],
    date: [''],
    startTime: [''],
    note: ['']
  });

  readonly editForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(200)]],
    type: ['', Validators.required],
    location: [''],
    latitude: [null as number | null],
    longitude: [null as number | null],
    date: [''],
    startTime: [''],
    note: ['']
  });

  constructor() {
    this.locationSub = this.form.get('location')!.valueChanges.subscribe((val: string | null) => {
      if (!val) {
        this.form.patchValue({ latitude: null, longitude: null }, { emitEvent: false });
      }
    });
    this.editLocationSub = this.editForm.get('location')!.valueChanges.subscribe((val: string | null) => {
      if (!val) {
        this.editForm.patchValue({ latitude: null, longitude: null }, { emitEvent: false });
      }
    });
  }

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

  ngOnDestroy(): void {
    this.locationSub.unsubscribe();
    this.editLocationSub.unsubscribe();
  }

  onPlaceSelected(event: PlaceSelectedEvent): void {
    this.form.patchValue({ location: event.name, latitude: event.lat, longitude: event.lng });
  }

  startEdit(step: Step): void {
    this.deletingStepId.set(null);
    this.deleteError.set(null);
    this.editingStepId.set(step.id);
    this.editForm.patchValue({
      name: step.name,
      type: step.type,
      location: step.location ?? '',
      latitude: step.latitude ?? null,
      longitude: step.longitude ?? null,
      date: step.date ?? '',
      startTime: step.startTime ?? '',
      note: step.note ?? ''
    });
    this.editFormError.set(null);
  }

  cancelEdit(): void {
    this.editingStepId.set(null);
    this.editForm.reset();
    this.editFormError.set(null);
  }

  confirmDelete(step: Step): void {
    if (this.isDeletingStep()) return;
    this.deletingStepId.set(step.id);
    this.deleteError.set(null);
  }

  cancelDelete(): void {
    this.deletingStepId.set(null);
    this.deleteError.set(null);
  }

  doDelete(): void {
    const stepId = this.deletingStepId();
    if (!stepId || this.isDeletingStep()) return;

    this.isDeletingStep.set(true);
    this.deleteError.set(null);

    this.stepService.deleteStep(this.tripId, stepId)
      .pipe(finalize(() => this.isDeletingStep.set(false)))
      .subscribe({
        next: () => this.deletingStepId.set(null),
        error: () => this.deleteError.set('Failed to delete step.')
      });
  }

  onEditPlaceSelected(event: PlaceSelectedEvent): void {
    this.editForm.patchValue({ location: event.name, latitude: event.lat, longitude: event.lng });
  }

  onEditSubmit(): void {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }
    if (this.isEditSubmitting()) return;

    this.isEditSubmitting.set(true);
    this.editFormError.set(null);

    const stepId = this.editingStepId();
    if (!stepId) {
      this.isEditSubmitting.set(false);
      return;
    }
    const { name, type, location, date, startTime, latitude, longitude, note } = this.editForm.value;

    this.stepService.updateStep(this.tripId, stepId, {
      name,
      type,
      location: location?.trim() || undefined,
      latitude: latitude ?? undefined,
      longitude: longitude ?? undefined,
      date: date || undefined,
      startTime: startTime || undefined,
      note: note?.trim() || undefined
    }).pipe(
      finalize(() => this.isEditSubmitting.set(false))
    ).subscribe({
      next: () => {
        this.editingStepId.set(null);
        this.editForm.reset();
      },
      error: (err) => {
        const errors = err.error?.errors as Record<string, string[]> | undefined;
        if (errors) {
          const nameErrors: string[] = errors['Name'] ?? errors['name'] ?? [];
          if (nameErrors.length > 0) {
            this.editForm.get('name')!.setErrors({ serverError: nameErrors[0] });
          }
          const other = Object.entries(errors)
            .filter(([k]) => k.toLowerCase() !== 'name')
            .flatMap(([, msgs]) => msgs)[0];
          this.editFormError.set(other ?? null);
        } else {
          this.editFormError.set(err.error?.detail ?? 'Failed to update step.');
        }
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.isSubmitting()) return;

    this.isSubmitting.set(true);
    this.formError.set(null);

    const { name, type, location, date, startTime, latitude, longitude, note } = this.form.value;

    this.stepService.addStep(this.tripId, {
      name,
      type,
      location: location?.trim() || undefined,
      latitude: latitude ?? undefined,
      longitude: longitude ?? undefined,
      date: date || undefined,
      startTime: startTime || undefined,
      note: note?.trim() || undefined
    }).pipe(
      finalize(() => this.isSubmitting.set(false))
    ).subscribe({
      next: () => {
        this.form.reset();
        this.showAddForm.set(false);
      },
      error: (err) => {
        const errors = err.error?.errors as Record<string, string[]> | undefined;
        if (errors) {
          const nameErrors: string[] = errors['Name'] ?? errors['name'] ?? [];
          if (nameErrors.length > 0) {
            this.nameControl.setErrors({ serverError: nameErrors[0] });
          }
          const other = Object.entries(errors)
            .filter(([k]) => k.toLowerCase() !== 'name')
            .flatMap(([, msgs]) => msgs)[0];
          this.formError.set(other ?? null);
        } else {
          this.formError.set(err.error?.detail ?? 'Failed to add step.');
        }
      }
    });
  }

  onDrop(event: CdkDragDrop<Step[]>): void {
    if (event.previousIndex === event.currentIndex) return;

    const reordered = [...this.steps()];
    moveItemInArray(reordered, event.previousIndex, event.currentIndex);
    const stepIds = reordered.map(s => s.id);

    this.reorderError.set(null);
    this.stepService.reorderSteps(this.tripId, stepIds).subscribe({
      error: () => this.reorderError.set('Failed to reorder steps. Order has been restored.')
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
