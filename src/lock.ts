import { Condition } from './condition.js';
import { Awaitable } from './types.js';

// Types
export interface LockHolder extends Disposable {
  release(): void;
}

// Class
export class Lock {
  // Attributes
  private _count = 0;
  private readonly _locked = new Condition(() => this._count > 0);

  // Methods
  async acquire(): Promise<LockHolder> {
    await this._locked.waitFor(false);

    this._count++;
    this._locked.check();

    return {
      release: () => this.release(),
      [Symbol.dispose]: () => this.release(),
    };
  }

  release(): void {
    this._count--;
    this._locked.check();
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
    return this._locked.value;
  }
}
