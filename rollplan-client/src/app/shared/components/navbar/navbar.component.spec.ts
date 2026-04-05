import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideRouter } from '@angular/router';
import { signal, computed } from '@angular/core';
import { vi } from 'vitest';
import { NavbarComponent } from './navbar.component';
import { AuthService } from '../../../auth/services/auth.service';

describe('NavbarComponent', () => {
  let isAuthenticated: ReturnType<typeof signal<boolean>>;
  let logoutSpy: ReturnType<typeof vi.fn>;

  function buildComponent() {
    return TestBed.createComponent(NavbarComponent);
  }

  beforeEach(() => {
    isAuthenticated = signal(false);
    logoutSpy = vi.fn();

    const authServiceStub = {
      isAuthenticated: computed(() => isAuthenticated()),
      logout: logoutSpy
    };

    TestBed.configureTestingModule({
      imports: [NavbarComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceStub }
      ]
    });
  });

  it('should not render nav content when not authenticated', () => {
    isAuthenticated.set(false);
    const fixture = buildComponent();
    fixture.detectChanges();

    const nav = fixture.nativeElement.querySelector('nav');
    expect(nav).toBeNull();
  });

  it('should render nav links when authenticated', () => {
    isAuthenticated.set(true);
    const fixture = buildComponent();
    fixture.detectChanges();

    const nav = fixture.nativeElement.querySelector('nav');
    expect(nav).not.toBeNull();

    const links = fixture.nativeElement.querySelectorAll('a[routerlink]');
    const hrefs = Array.from(links).map((a: any) => a.getAttribute('routerlink'));
    expect(hrefs).toContain('/trips');
    expect(hrefs).toContain('/profile');
  });

  it('should call authService.logout() and navigate to /login when logout() is called', () => {
    isAuthenticated.set(true);
    const fixture = buildComponent();
    fixture.detectChanges();

    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture.componentInstance.logout();

    expect(logoutSpy).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
  });
});
