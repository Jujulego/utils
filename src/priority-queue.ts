import { BST } from './bst';
import { Condition } from './condition';

// Types
interface PQItem<T> {
  priority: number;
  data: T;
}

// Class
export class PriorityQueue<T> implements AsyncIterable<T> {
  // Attributes
  private readonly _items = BST.empty((item: PQItem<T>) => item.priority, (a, b) => a - b);
  private readonly _hasItems = new Condition(() => this._items.length > 0);

  // Methods
  insert(data: T, priority = 0): void {
    this._items.insert({ priority, data }, 'before');
    this._hasItems.check();
  }

  async pop(): Promise<T> {
    let item = this._items.pop();

    while (!item) {
      await this._hasItems.waitFor(true);
      item = this._items.pop();
    }

    this._hasItems.check();

    return item.data;
  }

  [Symbol.asyncIterator](): AsyncIterator<T, void> {
    return {
      next: async (): Promise<IteratorResult<T, void>> => ({ value: await this.pop() }),
    };
  }
}
