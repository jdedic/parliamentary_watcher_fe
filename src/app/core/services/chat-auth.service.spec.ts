import { TestBed } from '@angular/core/testing';
import { ChatAuthService } from './chat-auth.service';

describe('ChatAuthService', () => {
  let service: ChatAuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ChatAuthService],
    });
    service = TestBed.inject(ChatAuthService);
  });

  describe('initial state', () => {
    it('unlocked() is false before any call to unlock()', () => {
      expect(service.unlocked()).toBe(false);
    });
  });

  describe('unlock()', () => {
    it('sets unlocked() to true', () => {
      service.unlock();
      expect(service.unlocked()).toBe(true);
    });

    it('calling unlock() twice leaves unlocked() as true (idempotent)', () => {
      service.unlock();
      service.unlock();
      expect(service.unlocked()).toBe(true);
    });
  });

  describe('unlocked is readonly', () => {
    it('exposes unlocked as a readonly signal — the writable _unlocked is not accessible externally', () => {
      // Verify the exposed signal is the readonly projection: it has no .set method.
      expect((service.unlocked as any).set).toBeUndefined();
    });
  });
});
