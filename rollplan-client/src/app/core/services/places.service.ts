import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

export interface PlaceSelectedEvent {
  name: string;
  lat: number;
  lng: number;
}

@Injectable({ providedIn: 'root' })
export class PlacesService {
  private scriptLoaded = false;

  load(): Promise<void> {
    if (!environment.mapsApiKey) return Promise.resolve();
    if (this.scriptLoaded || this.isAvailable()) {
      this.scriptLoaded = true;
      return Promise.resolve();
    }
    return new Promise<void>((resolve) => {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${environment.mapsApiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => { this.scriptLoaded = true; resolve(); };
      script.onerror = () => resolve();
      document.head.appendChild(script);
    });
  }

  isAvailable(): boolean {
    return (window as any)['google']?.maps?.places !== undefined;
  }
}
