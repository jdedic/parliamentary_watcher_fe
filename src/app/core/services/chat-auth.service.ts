import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ChatAuthService {
  private _unlocked = signal(false);
  private _key = signal<string | null>(null);

  readonly unlocked = this._unlocked.asReadonly();
  readonly key = this._key.asReadonly();

  unlock(key: string): void {
    this._key.set(key);
    this._unlocked.set(true);
  }
}
