import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { RegisterComponent } from './register.component';

describe('RegisterComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(RegisterComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should have an invalid form when empty', () => {
    const fixture = TestBed.createComponent(RegisterComponent);
    const component = fixture.componentInstance;
    expect(component.form.invalid).toBe(true);
  });

  it('should be invalid with a bad email format', () => {
    const fixture = TestBed.createComponent(RegisterComponent);
    const component = fixture.componentInstance;
    component.emailControl.setValue('not-an-email');
    component.passwordControl.setValue('password123');
    expect(component.form.invalid).toBe(true);
    expect(component.emailControl.hasError('email')).toBe(true);
  });

  it('should be invalid when password is less than 6 characters', () => {
    const fixture = TestBed.createComponent(RegisterComponent);
    const component = fixture.componentInstance;
    component.emailControl.setValue('user@example.com');
    component.passwordControl.setValue('abc');
    expect(component.form.invalid).toBe(true);
    expect(component.passwordControl.hasError('minlength')).toBe(true);
  });

  it('should be valid with proper email and 6-char password', () => {
    const fixture = TestBed.createComponent(RegisterComponent);
    const component = fixture.componentInstance;
    component.emailControl.setValue('user@example.com');
    component.passwordControl.setValue('abc123');
    expect(component.form.valid).toBe(true);
  });

  it('isLoading should start as false', () => {
    const fixture = TestBed.createComponent(RegisterComponent);
    const component = fixture.componentInstance;
    expect(component.isLoading()).toBe(false);
  });

  it('serverError should start as null', () => {
    const fixture = TestBed.createComponent(RegisterComponent);
    const component = fixture.componentInstance;
    expect(component.serverError()).toBeNull();
  });
});
