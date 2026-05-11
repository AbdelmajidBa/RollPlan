import { Component, AfterViewInit, OnDestroy, ViewChild, ElementRef, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';
import { StepService, Step } from '../../steps/services/step.service';

@Component({
  selector: 'app-trip-map',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './trip-map.component.html'
})
export class TripMapComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mapContainer') mapContainer!: ElementRef<HTMLDivElement>;

  private map?: L.Map;
  private readonly markersLayer = L.layerGroup();
  private routeLine?: L.Polyline;
  private readonly stepService = inject(StepService);

  readonly mapEmpty = signal(true);

  constructor() {
    effect(() => {
      const steps = this.stepService.steps();
      if (this.map) {
        this.updateMarkers(steps);
      }
    });
  }

  ngAfterViewInit(): void {
    try {
      this.map = L.map(this.mapContainer.nativeElement).setView([20, 0], 2);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(this.map);
      this.markersLayer.addTo(this.map);
      this.updateMarkers(this.stepService.steps());
    } catch (err) {
      console.error('TripMapComponent: Leaflet failed to initialize', err);
    }
  }

  private updateMarkers(steps: Step[]): void {
    this.markersLayer.clearLayers();
    const located = steps.filter(s => s.latitude != null && s.longitude != null);
    this.mapEmpty.set(located.length === 0);

    if (located.length === 0) return;

    const bounds: [number, number][] = [];
    located.forEach((step) => {
      const latlng: [number, number] = [step.latitude!, step.longitude!];
      L.circleMarker(latlng, {
        radius: 8,
        fillColor: '#0ea5e9',
        color: '#fff',
        weight: 2,
        fillOpacity: 0.9
      })
        .bindTooltip(`${step.sortOrder}. ${step.name}`)
        .addTo(this.markersLayer);
      bounds.push(latlng);
    });

    this.routeLine?.remove();
    this.routeLine = undefined;
    if (located.length >= 2) {
      this.routeLine = L.polyline(bounds, {
        color: '#0ea5e9',
        weight: 3,
        opacity: 0.6
      }).addTo(this.map!);
    }

    if (located.length === 1) {
      this.map!.setView(bounds[0], 13);
    } else {
      this.map!.fitBounds(L.latLngBounds(bounds), { padding: [40, 40] });
    }
    setTimeout(() => this.map?.invalidateSize(), 0);
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }
}
