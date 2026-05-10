import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { StepService, Step } from './step.service';
import { API_BASE_URL } from '../../core/config/api.config';

describe('StepService', () => {
  let service: StepService;
  let httpMock: HttpTestingController;

  const tripId = '11111111-1111-1111-1111-111111111111';

  const mockStep: Step = {
    id: '22222222-2222-2222-2222-222222222222',
    tripId,
    name: 'Ferry Crossing',
    type: 'Travel',
    sortOrder: 1,
    createdAt: '2026-05-09T10:00:00Z',
    updatedAt: '2026-05-09T10:00:00Z'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        StepService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(StepService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getSteps should GET /trips/:tripId/steps', () => {
    service.getSteps(tripId).subscribe();

    const req = httpMock.expectOne(`${API_BASE_URL}/trips/${tripId}/steps`);
    expect(req.request.method).toBe('GET');
    req.flush([mockStep]);
  });

  it('getSteps should populate _steps signal', () => {
    service.getSteps(tripId).subscribe();
    httpMock.expectOne(`${API_BASE_URL}/trips/${tripId}/steps`).flush([mockStep]);

    expect(service.steps().length).toBe(1);
    expect(service.steps()[0]).toEqual(mockStep);
  });

  it('addStep should POST /trips/:tripId/steps with JSON body', () => {
    const request = { name: 'Ferry Crossing', type: 'Travel' as const };
    service.addStep(tripId, request).subscribe();

    const req = httpMock.expectOne(`${API_BASE_URL}/trips/${tripId}/steps`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush(mockStep);
  });

  it('addStep should append step to _steps signal', () => {
    const request = { name: 'Ferry Crossing', type: 'Travel' as const };
    service.addStep(tripId, request).subscribe();
    httpMock.expectOne(`${API_BASE_URL}/trips/${tripId}/steps`).flush(mockStep);

    expect(service.steps().length).toBe(1);
    expect(service.steps()[0]).toEqual(mockStep);
  });
});
