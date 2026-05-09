import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TripService, Trip } from './trip.service';
import { API_BASE_URL } from '../../core/config/api.config';

describe('TripService', () => {
  let service: TripService;
  let httpMock: HttpTestingController;

  const mockTrip: Trip = {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Test Trip',
    description: 'A test trip',
    status: 'Planning',
    createdAt: '2026-05-09T10:00:00Z',
    updatedAt: '2026-05-09T10:00:00Z'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TripService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(TripService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('createTrip should POST to /trips with FormData and return trip', () => {
    let result: Trip | undefined;
    service.createTrip({ name: 'Test Trip', description: 'A test trip' })
      .subscribe(trip => result = trip);

    const req = httpMock.expectOne(`${API_BASE_URL}/trips`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body instanceof FormData).toBe(true);
    req.flush(mockTrip);

    expect(result).toEqual(mockTrip);
  });

  it('createTrip should update trips signal on success', () => {
    expect(service.trips().length).toBe(0);
    service.createTrip({ name: 'Test Trip' }).subscribe();

    const req = httpMock.expectOne(`${API_BASE_URL}/trips`);
    req.flush(mockTrip);

    expect(service.trips().length).toBe(1);
    expect(service.trips()[0]).toEqual(mockTrip);
  });

  it('createTrip should include coverImage in FormData when provided', () => {
    const file = new File(['data'], 'cover.jpg', { type: 'image/jpeg' });
    service.createTrip({ name: 'Trip with Image', coverImage: file }).subscribe();

    const req = httpMock.expectOne(`${API_BASE_URL}/trips`);
    expect(req.request.body instanceof FormData).toBe(true);
    expect((req.request.body as FormData).get('coverImage')).toBeTruthy();
    req.flush(mockTrip);
  });

  it('createTrip should not include description in FormData when not provided', () => {
    service.createTrip({ name: 'No Description' }).subscribe();

    const req = httpMock.expectOne(`${API_BASE_URL}/trips`);
    const fd = req.request.body as FormData;
    expect(fd.get('description')).toBeNull();
    req.flush(mockTrip);
  });

  it('getTrips should make GET request to /trips', () => {
    service.getTrips().subscribe();

    const req = httpMock.expectOne(`${API_BASE_URL}/trips`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('getTrips should populate trips signal with response data', () => {
    const mockTrips = [mockTrip];
    service.getTrips().subscribe();

    const req = httpMock.expectOne(`${API_BASE_URL}/trips`);
    req.flush(mockTrips);

    expect(service.trips()).toEqual(mockTrips);
  });

  it('getTrip should make GET request to /trips/:id', () => {
    const id = mockTrip.id;
    service.getTrip(id).subscribe();

    const req = httpMock.expectOne(`${API_BASE_URL}/trips/${id}`);
    expect(req.request.method).toBe('GET');
    req.flush(mockTrip);
  });

  it('getTrip should set currentTrip signal', () => {
    const id = mockTrip.id;
    service.getTrip(id).subscribe();

    const req = httpMock.expectOne(`${API_BASE_URL}/trips/${id}`);
    req.flush(mockTrip);

    expect(service.currentTrip()).toEqual(mockTrip);
  });

  it('updateTrip should make PUT request to /trips/:id with FormData', () => {
    const id = mockTrip.id;
    service.updateTrip(id, { name: 'Updated' }).subscribe();

    const req = httpMock.expectOne(`${API_BASE_URL}/trips/${id}`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body instanceof FormData).toBe(true);
    req.flush(mockTrip);
  });

  it('updateTrip should update currentTrip and trips list signals', () => {
    const id = mockTrip.id;
    const updated = { ...mockTrip, name: 'Updated' };

    // Pre-populate list
    service.getTrips().subscribe();
    httpMock.expectOne(`${API_BASE_URL}/trips`).flush([mockTrip]);

    service.updateTrip(id, { name: 'Updated' }).subscribe();
    httpMock.expectOne(`${API_BASE_URL}/trips/${id}`).flush(updated);

    expect(service.currentTrip()).toEqual(updated);
    expect(service.trips()[0]).toEqual(updated);
  });
});
