import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { ProfileComponent } from './auth/profile/profile.component';
import { TripListComponent } from './trips/trip-list/trip-list.component';
import { TripFormComponent } from './trips/trip-form/trip-form.component';
import { TripDetailComponent } from './trips/trip-detail/trip-detail.component';
import { authGuard } from './auth/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'trips', component: TripListComponent, canActivate: [authGuard] },
  { path: 'trips/create', component: TripFormComponent, canActivate: [authGuard] },
  { path: 'trips/:id', component: TripDetailComponent, canActivate: [authGuard] },
  { path: 'profile', component: ProfileComponent, canActivate: [authGuard] }
];
