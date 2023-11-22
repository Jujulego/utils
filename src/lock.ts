import { Condition } from './condition.js';
import { Awaitable } from './types.js';

// Class
export class Lock implements Disposable {
  // Attributes
  private _count = 0;
  private readonly _locked = new Condition(() => this._count > 0);

  // Methods
  async acquire(): Promise<this> {
    await this._locked.waitFor(false);

    this._count++;
    this._locked.check();

    return this;
  }

  release(): void {
    this._count = Math.max(this._count - 1, 0);
    this._locked.check();
  }

  async with<R>(fn: () => Awaitable<R>): Promise<R> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    using _ = await this.acquire();

    return fn();
  }

  [Symbol.dispose](): void {
    this.release();
  }

  // Properties
  get locked(): boolean {
    return this._locked.value;
  }
}
