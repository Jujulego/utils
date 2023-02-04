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

  async pop(): Promise<T> {
    let item = this._items.pop();

    while (!item) {
      await this._hasItems.waitFor(true);
      item = this._items.pop();
    }

    this._hasItems.check();

    return item;
  }

  [Symbol.asyncIterator](): AsyncIterator<T, void> {
    return {
      next: async (): Promise<IteratorResult<T, void>> => ({ value: await this.pop() }),
    };
  }
}
