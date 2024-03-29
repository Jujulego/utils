import { BST } from './bst.js';
import { Condition } from './condition.js';

// Types
export type PriorityOrder = 'highest' | 'lowest';

interface PQItem<T> {
  priority: number;
  data: T;
}

// Class
export class PriorityQueue<T> implements AsyncIterable<T> {
  // Attributes
  private readonly _items: BST<PQItem<T>, number>;
  private readonly _hasItems: Condition;

  // Constructor
  constructor(order: PriorityOrder = 'highest') {
    if (order === 'lowest') {
      this._items = BST.empty((item: PQItem<T>) => item.priority, (a, b) => b - a);
    } else {
      this._items = BST.empty((item: PQItem<T>) => item.priority, (a, b) => a - b);
    }

    this._hasItems = new Condition(() => this._items.length > 0);
  }

  // Methods
  insert(data: T, priority = 0): void {
    this._items.insert({ priority, data }, 'before');
    this._hasItems.check();
  }

  private _popSync(): T | undefined {
    return this._items.pop()?.data;
  }

  private async _popAsync(): Promise<T> {
    let item = this._items.pop();

    while (!item) {
      await this._hasItems.waitFor(true);
      item = this._items.pop();
    }

    this._hasItems.check();

    return item.data;
  }

  pop(opts?: { sync?: false }): Promise<T>;
  pop(opts: { sync: true }): T | undefined;
  pop(opts: { sync?: boolean } = {}): Promise<T> | T | undefined {
    return opts.sync ? this._popSync() : this._popAsync();
  }

  [Symbol.iterator](): Iterator<T, void> {
    return {
      next: (): IteratorResult<T, void> => {
        const value = this._items.pop()?.data;
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
