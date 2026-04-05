import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { ProfileComponent } from './profile.component';
import { AuthService } from '../services/auth.service';

describe('ProfileComponent', () => {
  let getProfileSpy: ReturnType<typeof vi.fn>;
  let updateProfileSpy: ReturnType<typeof vi.fn>;

  function buildComponent() {
    return TestBed.createComponent(ProfileComponent);
  }

  beforeEach(() => {
    getProfileSpy = vi.fn();
    updateProfileSpy = vi.fn();

    const authServiceStub = {
      getProfile: getProfileSpy,
      updateProfile: updateProfileSpy
    };

    TestBed.configureTestingModule({
      imports: [ProfileComponent, ReactiveFormsModule],
      providers: [
        { provide: AuthService, useValue: authServiceStub }
      ]
    });
  });

  it('should pre-populate form from getProfile() response', async () => {
    getProfileSpy.mockReturnValue(of({ email: 'user@example.com', displayName: 'Alice' }));

    const fixture = buildComponent();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.componentInstance.form.value.email).toBe('user@example.com');
    expect(fixture.componentInstance.form.value.displayName).toBe('Alice');
  });

  it('should show serverError when getProfile() fails', async () => {
    getProfileSpy.mockReturnValue(throwError(() => new Error('Network error')));

    const fixture = buildComponent();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.componentInstance.serverError()).toBe('Failed to load profile.');
  });

  it('should call updateProfile() on submit with valid data', async () => {
    getProfileSpy.mockReturnValue(of({ email: 'user@example.com', displayName: 'Alice' }));
    updateProfileSpy.mockReturnValue(of({ email: 'user@example.com', displayName: 'Alice' }));

    const fixture = buildComponent();
    fixture.detectChanges();
    await fixture.whenStable();

    fixture.componentInstance.form.setValue({ displayName: 'Alice', email: 'user@example.com' });
    fixture.componentInstance.onSubmit();

    expect(updateProfileSpy).toHaveBeenCalledWith('Alice', 'user@example.com');
  });

  it('should show successMessage on successful update', async () => {
    getProfileSpy.mockReturnValue(of({ email: 'user@example.com', displayName: 'Alice' }));
    updateProfileSpy.mockReturnValue(of({ email: 'user@example.com', displayName: 'Alice' }));

    const fixture = buildComponent();
    fixture.detectChanges();
    await fixture.whenStable();

    fixture.componentInstance.form.setValue({ displayName: 'Alice', email: 'user@example.com' });
    fixture.componentInstance.onSubmit();

    expect(fixture.componentInstance.successMessage()).toBe('Profile updated successfully.');
  });

  it('should show serverError from detail on 400 error', async () => {
    getProfileSpy.mockReturnValue(of({ email: 'user@example.com', displayName: 'Alice' }));
    updateProfileSpy.mockReturnValue(
      throwError(() => ({ error: { detail: 'Email is already in use.' } }))
    );

    const fixture = buildComponent();
    fixture.detectChanges();
    await fixture.whenStable();

    fixture.componentInstance.form.setValue({ displayName: 'Alice', email: 'taken@example.com' });
    fixture.componentInstance.onSubmit();

    expect(fixture.componentInstance.serverError()).toBe('Email is already in use.');
  });

  it('should show fallback error message when detail is missing', async () => {
    getProfileSpy.mockReturnValue(of({ email: 'user@example.com', displayName: 'Alice' }));
    updateProfileSpy.mockReturnValue(throwError(() => ({ error: {} })));

    const fixture = buildComponent();
    fixture.detectChanges();
    await fixture.whenStable();

    fixture.componentInstance.form.setValue({ displayName: 'Alice', email: 'user@example.com' });
    fixture.componentInstance.onSubmit();

    expect(fixture.componentInstance.serverError()).toBe('Failed to update profile.');
  });

  it('should not call updateProfile() when form is invalid', async () => {
    getProfileSpy.mockReturnValue(of({ email: 'user@example.com', displayName: 'Alice' }));

    const fixture = buildComponent();
    fixture.detectChanges();
    await fixture.whenStable();

    fixture.componentInstance.form.setValue({ displayName: '', email: '' });
    fixture.componentInstance.onSubmit();

    expect(updateProfileSpy).not.toHaveBeenCalled();
  });
});
