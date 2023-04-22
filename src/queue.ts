import { Condition } from './condition';

// Class
export class Queue<T> implements AsyncIterable<T> {
  // Attributes
  private readonly _items: T[] = [];
  private readonly _hasItems = new Condition(() => this._items.length > 0);

  // Methods
  insert(data: T): void {
    this._items.unshift(data);
    this._hasItems.check();
  }

  private _popSync(): T | undefined {
    return this._items.pop();
  }

  private async _popAsync(): Promise<T> {
    let item = this._items.pop();

    while (!item) {
      await this._hasItems.waitFor(true);
      item = this._items.pop();
    }

    this._hasItems.check();

    return item;
  }

  pop(opts?: { sync?: false }): Promise<T>;
  pop(opts: { sync: true }): T | undefined;
  pop(opts: { sync?: boolean } = {}): Promise<T> | T | undefined {
    return opts.sync ? this._popSync() : this._popAsync();
  }

  [Symbol.iterator](): Iterator<T, void> {
    return {
      next: (): IteratorResult<T, void> => {
        const value = this._items.pop();
        return value === undefined ? { done: true, value: undefined } : { value };
      }
    };
  }

  [Symbol.asyncIterator](): AsyncIterator<T, void> {
    return {
      next: async (): Promise<IteratorResult<T, void>> => ({ value: await this.pop() }),
    };
  }

  // Attributes
  get length(): number {
    return this._items.length;
  }
}
