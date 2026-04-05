import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { LoginComponent } from './login.component';
import { API_BASE_URL } from '../../core/config/api.config';

describe('LoginComponent', () => {
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
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
    localStorage.clear();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should have an invalid form when empty', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    const component = fixture.componentInstance;
    expect(component.form.invalid).toBe(true);
  });

  it('should show email validation error when email is invalid and touched', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    const component = fixture.componentInstance;
    component.emailControl.setValue('not-an-email');
    component.emailControl.markAsTouched();
    expect(component.emailControl.invalid).toBe(true);
    expect(component.emailControl.hasError('email')).toBe(true);
  });

  it('should show password required error when empty and touched', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    const component = fixture.componentInstance;
    component.passwordControl.setValue('');
    component.passwordControl.markAsTouched();
    expect(component.passwordControl.invalid).toBe(true);
    expect(component.passwordControl.hasError('required')).toBe(true);
  });

  it('isLoading should start as false', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    expect(fixture.componentInstance.isLoading()).toBe(false);
  });

  it('serverError should start as null', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    expect(fixture.componentInstance.serverError()).toBeNull();
  });

  it('should set serverError on 401 response', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    const component = fixture.componentInstance;

    component.form.setValue({ email: 'test@example.com', password: 'wrongpassword' });
    component.onSubmit();

    const req = httpMock.expectOne(`${API_BASE_URL}/auth/login`);
    req.flush(
      { detail: 'Invalid email or password.' },
      { status: 401, statusText: 'Unauthorized' }
    );

    expect(component.serverError()).toBe('Invalid email or password.');
  });

  it('should not call API when form is invalid', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    const component = fixture.componentInstance;
    component.form.setValue({ email: '', password: '' });
    component.onSubmit();
    httpMock.expectNone(`${API_BASE_URL}/auth/login`);
  });
});
