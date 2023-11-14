import { Observable } from '@jujulego/event-tree';

import { Condition } from './condition.js';

// Class
export class Flag implements Observable<boolean> {
  // Attributes
  private _isRaised: boolean;

  private readonly _condition = new Condition(() => this._isRaised);

  // Constructor
  constructor(isRaised = false) {
    this._isRaised = isRaised;
  }

  // Methods
  readonly subscribe = this._condition.subscribe;
  readonly unsubscribe = this._condition.unsubscribe;
  readonly clear = this._condition.clear;

  raise(): void {
    this._isRaised = true;
    this._condition.check();
  }

  lower(): void {
    this._isRaised = false;
    this._condition.check();
  }

  async waitFor(value: boolean): Promise<void> {
    await this._condition.waitFor(value);
  }
}
