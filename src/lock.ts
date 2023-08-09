import { Condition } from './condition.js';
import { Awaitable } from './types.js';

// Class
export class Lock {
  // Attributes
  private _count = 0;
  private readonly _locked = new Condition(() => this._count > 0);

  // Methods
  async acquire(): Promise<void> {
    await this._locked.waitFor(false);

    this._count++;
    this._locked.check();
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
