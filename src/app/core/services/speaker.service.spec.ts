import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { SpeakerService } from './speaker.service';
import { environment } from '../../../environments/environment';

describe('SpeakerService', () => {
  let service: SpeakerService;
  let httpController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        SpeakerService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(SpeakerService);
    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpController.verify();
  });

  it('getSpeaker(1) sends GET to <apiUrl>/speakers/1', () => {
    service.getSpeaker(1).subscribe();

    const req = httpController.expectOne(`${environment.apiUrl}/speakers/1`);
    expect(req.request.method).toBe('GET');
    req.flush({
      id: 1,
      name: 'Jane Doe',
      function: 'Minister of Finance',
      party_afkorting: 'GRN',
      party_name_nl: 'Groene Partij',
      party_name_en: 'Green Party',
      image_url: '',
      resolved: true,
    });
  });

  it('getSpeaker() resolves with the body returned by the backend', () => {
    let result: unknown;
    service.getSpeaker(42).subscribe(s => { result = s; });

    const req = httpController.expectOne(`${environment.apiUrl}/speakers/42`);
    const body = {
      id: 42,
      name: 'John Smith',
      function: null,
      party_afkorting: null,
      party_name_nl: null,
      party_name_en: null,
      image_url: '',
      resolved: false,
    };
    req.flush(body);

    expect(result).toEqual(body);
  });

  it('getSpeaker() propagates a 404 error to the subscriber', () => {
    let errorStatus: number | undefined;
    service.getSpeaker(999).subscribe({
      error: (err) => { errorStatus = err.status; },
    });

    const req = httpController.expectOne(`${environment.apiUrl}/speakers/999`);
    req.flush({ detail: 'Not found' }, { status: 404, statusText: 'Not Found' });

    expect(errorStatus).toBe(404);
  });

  it('getSpeakerImage(1) sends GET to <apiUrl>/speakers/1/image with responseType "blob"', () => {
    service.getSpeakerImage(1).subscribe();

    const req = httpController.expectOne(`${environment.apiUrl}/speakers/1/image`);
    expect(req.request.method).toBe('GET');
    expect(req.request.responseType).toBe('blob');
    req.flush(new Blob(['fake-image-bytes'], { type: 'image/png' }));
  });

  it('getSpeakerImage() resolves with the Blob returned by the backend', () => {
    let result: Blob | undefined;
    service.getSpeakerImage(7).subscribe(b => { result = b; });

    const req = httpController.expectOne(`${environment.apiUrl}/speakers/7/image`);
    const blob = new Blob(['fake-image-bytes'], { type: 'image/png' });
    req.flush(blob);

    expect(result).toBeInstanceOf(Blob);
  });

  it('getSpeakerImage() propagates a 404 error to the subscriber', () => {
    let errorStatus: number | undefined;
    service.getSpeakerImage(999).subscribe({
      error: (err) => { errorStatus = err.status; },
    });

    const req = httpController.expectOne(`${environment.apiUrl}/speakers/999/image`);
    // The request was made with responseType 'blob', so HttpTestingController
    // requires the flushed error body to be Blob-convertible too.
    req.flush(new Blob(['Not found'], { type: 'text/plain' }), { status: 404, statusText: 'Not Found' });

    expect(errorStatus).toBe(404);
  });
});
