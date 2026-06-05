import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors, HttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { authInterceptor } from './auth.interceptor';
import { environment } from '../../../environments/environment';

describe('authInterceptor', () => {
  let httpClient: HttpClient;
  let httpController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    httpClient = TestBed.inject(HttpClient);
    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpController.verify();
  });

  it('adds X-API-Key header for requests to environment.apiUrl', () => {
    httpClient.get(`${environment.apiUrl}/sessions`).subscribe();

    const req = httpController.expectOne(`${environment.apiUrl}/sessions`);
    expect(req.request.headers.get('X-API-Key')).toBe(environment.apiKey);
    req.flush([]);
  });

  it('does NOT add X-API-Key header for requests to other URLs', () => {
    httpClient.get('https://example.com/other').subscribe();

    const req = httpController.expectOne('https://example.com/other');
    expect(req.request.headers.has('X-API-Key')).toBe(false);
    req.flush([]);
  });
});
