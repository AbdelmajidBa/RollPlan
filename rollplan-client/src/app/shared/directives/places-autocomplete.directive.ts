import { Directive, ElementRef, EventEmitter, OnDestroy, OnInit, Output, inject } from '@angular/core';
import { PlacesService, PlaceSelectedEvent } from '../../core/services/places.service';

@Directive({ selector: '[appPlacesAutocomplete]', standalone: true })
export class PlacesAutocompleteDirective implements OnInit, OnDestroy {
  @Output() placeSelected = new EventEmitter<PlaceSelectedEvent>();

  private readonly el = inject(ElementRef);
  private readonly placesService = inject(PlacesService);
  private autocomplete: any = null;
  private listener: any = null;
  private destroyed = false;

  ngOnInit(): void {
    this.placesService.load().then(() => {
      if (this.destroyed || !this.placesService.isAvailable()) return;
      const g = (window as any)['google'];
      this.autocomplete = new g.maps.places.Autocomplete(
        this.el.nativeElement as HTMLInputElement,
        { fields: ['formatted_address', 'name', 'geometry'] }
      );
      this.listener = this.autocomplete.addListener('place_changed', () => {
        const place = this.autocomplete.getPlace();
        if (!place?.geometry?.location) return;
        const name = place.formatted_address ?? place.name ?? '';
        this.placeSelected.emit({
          name,
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng()
        });
      });
    });
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    if (this.listener) {
      const g = (window as any)['google'];
      g?.maps?.event?.removeListener(this.listener);
    }
    this.autocomplete = null;
  }
}
