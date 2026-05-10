import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { PlacesAutocompleteDirective } from './places-autocomplete.directive';
import { PlaceSelectedEvent } from '../../core/services/places.service';

@Component({
  template: `<input appPlacesAutocomplete (placeSelected)="onPlace($event)" />`,
  standalone: true,
  imports: [PlacesAutocompleteDirective]
})
class TestHostComponent {
  onPlace(_e: PlaceSelectedEvent) {}
}

describe('PlacesAutocompleteDirective', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent]
    }).compileComponents();
  });

  it('should create without error when google is unavailable', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    expect(() => fixture.detectChanges()).not.toThrow();
  });

  it('should render the host input element', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('input')).toBeTruthy();
  });
});
