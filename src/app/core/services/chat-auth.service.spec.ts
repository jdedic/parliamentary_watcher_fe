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

    it('key() is null before any call to unlock()', () => {
      expect(service.key()).toBeNull();
    });
  });

  describe('unlock()', () => {
    it('sets unlocked() to true', () => {
      service.unlock('secret-key');
      expect(service.unlocked()).toBe(true);
    });

    it('sets key() to the provided key', () => {
      service.unlock('secret-key');
      expect(service.key()).toBe('secret-key');
    });

    it('calling unlock() twice leaves unlocked() as true (idempotent)', () => {
      service.unlock('secret-key');
      service.unlock('secret-key');
      expect(service.unlocked()).toBe(true);
    });

    it('a later unlock() call updates key() to the new value', () => {
      service.unlock('first-key');
      service.unlock('second-key');
      expect(service.key()).toBe('second-key');
    });
  });

  describe('unlocked and key are readonly', () => {
    it('exposes unlocked as a readonly signal — the writable _unlocked is not accessible externally', () => {
      expect((service.unlocked as any).set).toBeUndefined();
    });

    it('exposes key as a readonly signal — the writable _key is not accessible externally', () => {
      expect((service.key as any).set).toBeUndefined();
    });
  });
});
