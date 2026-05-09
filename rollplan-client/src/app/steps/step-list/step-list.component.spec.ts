import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { vi } from 'vitest';
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

describe('StepListComponent', () => {
  let getStepsSpy: ReturnType<typeof vi.fn>;
  let addStepSpy: ReturnType<typeof vi.fn>;
  let stepsSignal: ReturnType<typeof signal<Step[]>>;

  beforeEach(async () => {
    getStepsSpy = vi.fn();
    addStepSpy = vi.fn();
    stepsSignal = signal<Step[]>([]);

    const stepServiceStub = {
      steps: stepsSignal.asReadonly(),
      getSteps: getStepsSpy,
      addStep: addStepSpy
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
});
