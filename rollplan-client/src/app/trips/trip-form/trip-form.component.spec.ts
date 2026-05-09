import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { TripFormComponent } from './trip-form.component';
import { API_BASE_URL } from '../../core/config/api.config';

describe('TripFormComponent', () => {
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TripFormComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(TripFormComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should have an invalid form when name is empty', () => {
    const fixture = TestBed.createComponent(TripFormComponent);
    const component = fixture.componentInstance;
    expect(component.form.invalid).toBe(true);
  });

  it('should have a valid form when name is provided', () => {
    const fixture = TestBed.createComponent(TripFormComponent);
    const component = fixture.componentInstance;
    component.nameControl.setValue('My Trip');
    expect(component.form.valid).toBe(true);
  });

  it('should show required error when name is touched and empty', () => {
    const fixture = TestBed.createComponent(TripFormComponent);
    const component = fixture.componentInstance;
    component.nameControl.setValue('');
    component.nameControl.markAsTouched();
    expect(component.nameControl.hasError('required')).toBe(true);
  });

  it('should not submit when form is invalid', () => {
    const fixture = TestBed.createComponent(TripFormComponent);
    const component = fixture.componentInstance;
    component.form.setValue({ name: '', description: '' });
    component.onSubmit();
    httpMock.expectNone(`${API_BASE_URL}/trips`);
  });

  it('isSubmitting should start as false', () => {
    const fixture = TestBed.createComponent(TripFormComponent);
    expect(fixture.componentInstance.isSubmitting()).toBe(false);
  });

  it('serverError should start as null', () => {
    const fixture = TestBed.createComponent(TripFormComponent);
    expect(fixture.componentInstance.serverError()).toBeNull();
  });

  it('should set fileError for non-image file type', () => {
    const fixture = TestBed.createComponent(TripFormComponent);
    const component = fixture.componentInstance;
    const file = new File(['data'], 'test.pdf', { type: 'application/pdf' });
    const event = { target: { files: [file], value: '' } } as unknown as Event;
    component.onFileChange(event);
    expect(component.fileError()).toBe('Only JPG and PNG files are allowed.');
  });

  it('should set fileError for file exceeding 10MB', () => {
    const fixture = TestBed.createComponent(TripFormComponent);
    const component = fixture.componentInstance;
    const largeContent = new Uint8Array(11 * 1024 * 1024);
    const file = new File([largeContent], 'big.jpg', { type: 'image/jpeg' });
    const event = { target: { files: [file], value: '' } } as unknown as Event;
    component.onFileChange(event);
    expect(component.fileError()).toBe('File must not exceed 10 MB.');
  });

  it('should set serverError on API failure', () => {
    const fixture = TestBed.createComponent(TripFormComponent);
    const component = fixture.componentInstance;
    component.form.setValue({ name: 'Test Trip', description: '' });
    component.onSubmit();

    const req = httpMock.expectOne(`${API_BASE_URL}/trips`);
    req.flush(
      { detail: 'Failed to create trip.' },
      { status: 500, statusText: 'Internal Server Error' }
    );

    expect(component.serverError()).toBe('Failed to create trip.');
  });
});
