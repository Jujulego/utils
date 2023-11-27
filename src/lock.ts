import { source$ } from 'kyrielle';
import { waitFor$ } from 'kyrielle/subscriptions';

import { Awaitable } from './types.js';

// Class
export class Lock {
  // Attributes
  private _count = 0;
  private _trigger = source$<void>();

  // Methods
  async acquire(): Promise<Disposable> {
    while (this.locked) {
      await waitFor$(this._trigger);
    }

    this._count++;

    return {
      [Symbol.dispose ?? Symbol.for('Symbol.dispose')]: () => this.release(),
    };
  }

  release(): void {
    if (this._count === 0) {
      throw new Error('You must first acquire a lock before releasing it');
    }

    this._count--;
    this._trigger.next();
  }

  async with<R>(fn: () => Awaitable<R>): Promise<R> {
    try {
      await this.acquire();
      return await fn();
    } finally {
      this.release();
    }
  }

  // Properties
  get locked(): boolean {
    return this._count > 0;
  }
}
