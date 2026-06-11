import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ChatAuthService {
  private _unlocked = signal(false);
  readonly unlocked = this._unlocked.asReadonly();

  unlock(): void {
    this._unlocked.set(true);
  }
}
