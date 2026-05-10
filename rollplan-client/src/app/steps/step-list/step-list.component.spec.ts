import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { StepListComponent } from './step-list.component';
import { StepService, Step } from '../services/step.service';

const mockStep: Step = {
  id: '22222222-2222-2222-2222-222222222222',
  tripId: '11111111-1111-1111-1111-111111111111',
  name: 'Ferry Crossing',
  type: 'Travel',
  sortOrder: 1,
  createdAt: '2026-05-09T10:00:00Z',
  updatedAt: '2026-05-09T10:00:00Z'
};

const mockStep2: Step = {
  id: '33333333-3333-3333-3333-333333333333',
  tripId: '11111111-1111-1111-1111-111111111111',
  name: 'Hotel Check-in',
  type: 'Accommodation',
  sortOrder: 2,
  createdAt: '2026-05-09T10:00:00Z',
  updatedAt: '2026-05-09T10:00:00Z'
};

describe('StepListComponent', () => {
  let getStepsSpy: ReturnType<typeof vi.fn>;
  let addStepSpy: ReturnType<typeof vi.fn>;
  let updateStepSpy: ReturnType<typeof vi.fn>;
  let deleteStepSpy: ReturnType<typeof vi.fn>;
  let reorderStepsSpy: ReturnType<typeof vi.fn>;
  let stepsSignal: ReturnType<typeof signal<Step[]>>;

  beforeEach(async () => {
    getStepsSpy = vi.fn();
    addStepSpy = vi.fn();
    updateStepSpy = vi.fn();
    deleteStepSpy = vi.fn();
    reorderStepsSpy = vi.fn();
    stepsSignal = signal<Step[]>([]);

    const stepServiceStub = {
      steps: stepsSignal.asReadonly(),
      getSteps: getStepsSpy,
      addStep: addStepSpy,
      updateStep: updateStepSpy,
      deleteStep: deleteStepSpy,
      reorderSteps: reorderStepsSpy
    };

    await TestBed.configureTestingModule({
      imports: [StepListComponent],
      providers: [
        { provide: StepService, useValue: stepServiceStub }
      ]
    }).compileComponents();
  });

  it('should create', () => {
    getStepsSpy.mockReturnValue(of([]));
    const fixture = TestBed.createComponent(StepListComponent);
    fixture.componentInstance.tripId = '11111111-1111-1111-1111-111111111111';
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should call getSteps on init', () => {
    getStepsSpy.mockReturnValue(of([mockStep]));
    const fixture = TestBed.createComponent(StepListComponent);
    fixture.componentInstance.tripId = '11111111-1111-1111-1111-111111111111';
    fixture.detectChanges();
    expect(getStepsSpy).toHaveBeenCalledWith('11111111-1111-1111-1111-111111111111');
  });

  it('should show add form when showAddForm is true', () => {
    getStepsSpy.mockReturnValue(of([]));
    const fixture = TestBed.createComponent(StepListComponent);
    fixture.componentInstance.tripId = '11111111-1111-1111-1111-111111111111';
    fixture.detectChanges();
    fixture.componentInstance.showAddForm.set(true);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('form')).toBeTruthy();
  });

  it('should hide add form when cancel clicked', () => {
    getStepsSpy.mockReturnValue(of([]));
    const fixture = TestBed.createComponent(StepListComponent);
    fixture.componentInstance.tripId = '11111111-1111-1111-1111-111111111111';
    fixture.detectChanges();
    fixture.componentInstance.showAddForm.set(true);
    fixture.detectChanges();
    fixture.componentInstance.cancelAdd();
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('form')).toBeFalsy();
  });

  it('should call addStep on submit with valid form', () => {
    getStepsSpy.mockReturnValue(of([]));
    addStepSpy.mockReturnValue(of(mockStep));
    const fixture = TestBed.createComponent(StepListComponent);
    fixture.componentInstance.tripId = '11111111-1111-1111-1111-111111111111';
    fixture.detectChanges();
    fixture.componentInstance.showAddForm.set(true);
    fixture.componentInstance.form.patchValue({ name: 'Ferry Crossing', type: 'Travel' });
    fixture.componentInstance.onSubmit();
    expect(addStepSpy).toHaveBeenCalledWith(
      '11111111-1111-1111-1111-111111111111',
      expect.objectContaining({ name: 'Ferry Crossing', type: 'Travel' })
    );
  });

  it('should set lat/lng form values on placeSelected', () => {
    getStepsSpy.mockReturnValue(of([]));
    const fixture = TestBed.createComponent(StepListComponent);
    fixture.componentInstance.tripId = '11111111-1111-1111-1111-111111111111';
    fixture.detectChanges();
    fixture.componentInstance.showAddForm.set(true);
    fixture.detectChanges();

    fixture.componentInstance.onPlaceSelected({ name: 'Eiffel Tower, Paris', lat: 48.8584, lng: 2.2945 });

    expect(fixture.componentInstance.form.value.location).toBe('Eiffel Tower, Paris');
    expect(fixture.componentInstance.form.value.latitude).toBe(48.8584);
    expect(fixture.componentInstance.form.value.longitude).toBe(2.2945);
  });

  it('should show edit form when startEdit is called', () => {
    getStepsSpy.mockReturnValue(of([mockStep]));
    const fixture = TestBed.createComponent(StepListComponent);
    fixture.componentInstance.tripId = '11111111-1111-1111-1111-111111111111';
    stepsSignal.set([mockStep]);
    fixture.detectChanges();

    fixture.componentInstance.startEdit(mockStep);
    expect(fixture.componentInstance.editingStepId()).toBe(mockStep.id);
  });

  it('should prepopulate edit form with step values', () => {
    getStepsSpy.mockReturnValue(of([mockStep]));
    const fixture = TestBed.createComponent(StepListComponent);
    fixture.componentInstance.tripId = '11111111-1111-1111-1111-111111111111';
    fixture.detectChanges();

    fixture.componentInstance.startEdit(mockStep);
    expect(fixture.componentInstance.editForm.value.name).toBe('Ferry Crossing');
    expect(fixture.componentInstance.editForm.value.type).toBe('Travel');
  });

  it('should call updateStep on edit submit with valid form', () => {
    getStepsSpy.mockReturnValue(of([mockStep]));
    updateStepSpy.mockReturnValue(of({ ...mockStep, name: 'Updated Step' }));
    const fixture = TestBed.createComponent(StepListComponent);
    fixture.componentInstance.tripId = '11111111-1111-1111-1111-111111111111';
    fixture.detectChanges();

    fixture.componentInstance.startEdit(mockStep);
    fixture.componentInstance.editForm.patchValue({ name: 'Updated Step', type: 'Travel' });
    fixture.componentInstance.onEditSubmit();

    expect(updateStepSpy).toHaveBeenCalledWith(
      '11111111-1111-1111-1111-111111111111',
      mockStep.id,
      expect.objectContaining({ name: 'Updated Step', type: 'Travel' })
    );
  });

  it('should hide edit form on cancelEdit', () => {
    getStepsSpy.mockReturnValue(of([mockStep]));
    const fixture = TestBed.createComponent(StepListComponent);
    fixture.componentInstance.tripId = '11111111-1111-1111-1111-111111111111';
    fixture.detectChanges();

    fixture.componentInstance.startEdit(mockStep);
    fixture.componentInstance.cancelEdit();
    expect(fixture.componentInstance.editingStepId()).toBeNull();
  });

  it('should show confirm dialog when confirmDelete is called', () => {
    getStepsSpy.mockReturnValue(of([mockStep]));
    const fixture = TestBed.createComponent(StepListComponent);
    fixture.componentInstance.tripId = '11111111-1111-1111-1111-111111111111';
    stepsSignal.set([mockStep]);
    fixture.detectChanges();

    fixture.componentInstance.confirmDelete(mockStep);
    expect(fixture.componentInstance.deletingStepId()).toBe(mockStep.id);
  });

  it('should hide confirm dialog on cancelDelete', () => {
    getStepsSpy.mockReturnValue(of([mockStep]));
    const fixture = TestBed.createComponent(StepListComponent);
    fixture.componentInstance.tripId = '11111111-1111-1111-1111-111111111111';
    fixture.detectChanges();

    fixture.componentInstance.confirmDelete(mockStep);
    fixture.componentInstance.cancelDelete();
    expect(fixture.componentInstance.deletingStepId()).toBeNull();
  });

  it('should call deleteStep on doDelete', () => {
    getStepsSpy.mockReturnValue(of([mockStep]));
    deleteStepSpy.mockReturnValue(of(undefined));
    const fixture = TestBed.createComponent(StepListComponent);
    fixture.componentInstance.tripId = '11111111-1111-1111-1111-111111111111';
    fixture.detectChanges();

    fixture.componentInstance.confirmDelete(mockStep);
    fixture.componentInstance.doDelete();
    expect(deleteStepSpy).toHaveBeenCalledWith(
      '11111111-1111-1111-1111-111111111111',
      mockStep.id
    );
  });

  it('should set deleteError and reset isDeletingStep on doDelete error', () => {
    getStepsSpy.mockReturnValue(of([mockStep]));
    deleteStepSpy.mockReturnValue(throwError(() => new Error('server error')));
    const fixture = TestBed.createComponent(StepListComponent);
    fixture.componentInstance.tripId = '11111111-1111-1111-1111-111111111111';
    fixture.detectChanges();

    fixture.componentInstance.confirmDelete(mockStep);
    fixture.componentInstance.doDelete();
    expect(fixture.componentInstance.deleteError()).toBe('Failed to delete step.');
    expect(fixture.componentInstance.isDeletingStep()).toBe(false);
  });

  it('should call reorderSteps when step is dropped at new position', () => {
    getStepsSpy.mockReturnValue(of([mockStep, mockStep2]));
    reorderStepsSpy.mockReturnValue(of([mockStep2, mockStep]));
    stepsSignal.set([mockStep, mockStep2]);
    const fixture = TestBed.createComponent(StepListComponent);
    fixture.componentInstance.tripId = '11111111-1111-1111-1111-111111111111';
    fixture.detectChanges();

    const dropEvent = {
      previousIndex: 0,
      currentIndex: 1,
      item: {} as any,
      container: { data: [mockStep, mockStep2] } as any,
      previousContainer: { data: [mockStep, mockStep2] } as any,
      isPointerOverContainer: true,
      distance: { x: 0, y: 0 },
      dropPoint: { x: 0, y: 0 }
    } as CdkDragDrop<Step[]>;

    fixture.componentInstance.onDrop(dropEvent);
    expect(reorderStepsSpy).toHaveBeenCalledWith(
      '11111111-1111-1111-1111-111111111111',
      [mockStep2.id, mockStep.id]
    );
  });

  it('should not call reorderSteps when dropped at same position', () => {
    getStepsSpy.mockReturnValue(of([mockStep]));
    stepsSignal.set([mockStep]);
    const fixture = TestBed.createComponent(StepListComponent);
    fixture.componentInstance.tripId = '11111111-1111-1111-1111-111111111111';
    fixture.detectChanges();

    const dropEvent = {
      previousIndex: 0,
      currentIndex: 0,
      item: {} as any,
      container: { data: [mockStep] } as any,
      previousContainer: { data: [mockStep] } as any,
      isPointerOverContainer: true,
      distance: { x: 0, y: 0 },
      dropPoint: { x: 0, y: 0 }
    } as CdkDragDrop<Step[]>;

    fixture.componentInstance.onDrop(dropEvent);
    expect(reorderStepsSpy).not.toHaveBeenCalled();
  });

  it('should set reorderError when reorderSteps returns an error', () => {
    getStepsSpy.mockReturnValue(of([mockStep, mockStep2]));
    reorderStepsSpy.mockReturnValue(throwError(() => new Error('server error')));
    stepsSignal.set([mockStep, mockStep2]);
    const fixture = TestBed.createComponent(StepListComponent);
    fixture.componentInstance.tripId = '11111111-1111-1111-1111-111111111111';
    fixture.detectChanges();

    const dropEvent = {
      previousIndex: 0,
      currentIndex: 1,
      item: {} as any,
      container: { data: [mockStep, mockStep2] } as any,
      previousContainer: { data: [mockStep, mockStep2] } as any,
      isPointerOverContainer: true,
      distance: { x: 0, y: 0 },
      dropPoint: { x: 0, y: 0 }
    } as CdkDragDrop<Step[]>;

    fixture.componentInstance.onDrop(dropEvent);
    expect(fixture.componentInstance.reorderError()).toBe('Failed to reorder steps. Order has been restored.');
  });
});
