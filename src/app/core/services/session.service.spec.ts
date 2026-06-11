import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { SessionService } from './session.service';
import { environment } from '../../../environments/environment';

describe('SessionService', () => {
  let service: SessionService;
  let httpController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        SessionService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(SessionService);
    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpController.verify();
  });

  it('getSessions() sends GET to /sessions with skip=0, limit=20, status=SUMMARISED', () => {
    service.getSessions().subscribe();

    const req = httpController.expectOne(r => r.url === `${environment.apiUrl}/sessions`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('skip')).toBe('0');
    expect(req.request.params.get('limit')).toBe('20');
    expect(req.request.params.get('status')).toBe('SUMMARISED');
    req.flush({ total: 0, sessions: [] });
  });

  it('getSessions(0, 20, "climate") includes title=climate in query params', () => {
    service.getSessions(0, 20, 'climate').subscribe();

    const req = httpController.expectOne(r => r.url === `${environment.apiUrl}/sessions`);
    expect(req.request.params.get('title')).toBe('climate');
    req.flush({ total: 0, sessions: [] });
  });

  it('getSession("abc") sends GET to <apiUrl>/sessions/abc', () => {
    service.getSession('abc').subscribe();

    const req = httpController.expectOne(`${environment.apiUrl}/sessions/abc`);
    expect(req.request.method).toBe('GET');
    req.flush({
      id: 'abc', title: null, date: null, parliamentary_year: null,
      meeting_number: null, room: null, chair: null, status: null,
      summary: null, stances: null, summary_sources: null, documents: [],
    });
  });

  it('chat("abc", "hello", []) sends POST to <apiUrl>/sessions/abc/chat with correct body', () => {
    service.chat('abc', 'hello', []).subscribe();

    const req = httpController.expectOne(`${environment.apiUrl}/sessions/abc/chat`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ message: 'hello', history: [] });
    req.flush({
      answer: 'ok',
      retrieved_chunk_ids: [],
      matched_speakers: [],
      retrieval_confidence: 'high',
      generation_confidence: 'high',
      judge_verdict: 'pass',
    });
  });

  describe('verifyChat()', () => {
    it('sends POST to <apiUrl>/auth/chat with body { password }', () => {
      service.verifyChat('some-guid').subscribe();

      const req = httpController.expectOne(`${environment.apiUrl}/auth/chat`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ password: 'some-guid' });
      req.flush(null);
    });

    it('completes the observable successfully on a 200 response', () => {
      let completed = false;
      service.verifyChat('some-guid').subscribe({ complete: () => { completed = true; } });

      const req = httpController.expectOne(`${environment.apiUrl}/auth/chat`);
      req.flush(null, { status: 200, statusText: 'OK' });

      expect(completed).toBe(true);
    });

    it('errors the observable on a 401 response', () => {
      let errorStatus: number | undefined;
      service.verifyChat('wrong-password').subscribe({
        error: (err) => { errorStatus = err.status; },
      });

      const req = httpController.expectOne(`${environment.apiUrl}/auth/chat`);
      req.flush({ detail: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

      expect(errorStatus).toBe(401);
    });
  });
});
