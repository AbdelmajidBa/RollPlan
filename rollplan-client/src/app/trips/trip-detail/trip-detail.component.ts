import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-trip-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen bg-slate-950 px-4 py-12 text-slate-100 flex items-center justify-center">
      <div class="text-center">
        <p class="text-slate-400">Trip details coming soon.</p>
        <a routerLink="/trips" class="mt-4 inline-block text-sky-400 hover:underline">← Back to trips</a>
      </div>
    </div>
  `
})
export class TripDetailComponent {}
