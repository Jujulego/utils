// Types
export type ExtractKey<T, K> = (elem: T) => K;
export type NearestMode = 'lt' | 'lte' | 'gte' | 'gt';
export type InsertMode = 'before' | 'anywhere' | 'after';
export type Comparator<T> = (a: T, b: T) => number;

// Constants
const NEAREST_VALIDATOR: Record<NearestMode, (cmp: number) => boolean> = {
  lt:  cmp => cmp < 0,
  lte: cmp => cmp <= 0,
  gte: cmp => cmp >= 0,
  gt:  cmp => cmp > 0,
};

// Class
export class BST<T, K = T> {
  // Attributes
  private _array: T[];
  private readonly _extractor: ExtractKey<T, K>;
  private readonly _comparator: Comparator<K>;

  // Constructor
  private constructor(extractor: (elem: T) => K, comparator: Comparator<K>, elements: T[] = []) {
    this._array = elements;
    this._extractor = extractor;
    this._comparator = comparator;
  }

  // Statics
  static empty<T, K = T>(extractor: ExtractKey<T, K>, comparator: Comparator<K>): BST<T, K> {
    return new BST<T, K>(extractor, comparator);
  }

  static fromArray<T, K = T>(elements: T[], extractor: ExtractKey<T, K>, comparator: Comparator<K>): BST<T, K> {
    // Add and sort elements
    const array = Array.from(elements);
    array.sort((a, b) => comparator(extractor(a), extractor(b)));

    return new BST<T, K>(extractor, comparator as Comparator<K>, array);
  }

  static copy<T, K>(bst: BST<T, K>): BST<T, K> {
    return this.fromArray(bst._array, bst._extractor, bst._comparator);
  }

  // Methods
  private _searchOne(key: K): [number, T | null] {
    let si = 0;
    let ei = this._array.length;

    while (si !== ei) {
      const mi = Math.floor((ei + si) / 2);
      const obj = this.item(mi);

      const cmp = this._comparator(this._extractor(obj), key);
      if (cmp === 0) {
        return [mi, obj];
      }

      if (cmp < 0) {
        si = mi + 1;
      } else {
        ei = mi;
      }

      if (si === ei) {
        return [mi, null];
      }
    }

    return [0, null];
  }

  private* _searchAll(key: K): Generator<[number, T]> {
    const [idx, obj] = this._searchOne(key);

    // obj null means not found
    if (obj === null) return;

    // Yields all objects where comparator return 0
    yield [idx, obj];

    // - before
    for (let i = idx - 1; i >= 0; --i) {
      if (this._comparator(this._extractor(this._array[i]), key) === 0) {
        yield [i, this._array[i]];
      } else {
        break;
      }
    }

    // - after
    for (let i = idx + 1; i < this._array.length; ++i) {
      if (this._comparator(this._extractor(this._array[i]), key) === 0) {
        yield [i, this._array[i]];
      } else {
        break;
      }
    }
  }

  // - accessing
  /**
   * Access item by it's index
   * @param i
   */
  item(i: number): T {
    return this._array[i];
  }

  /**
   * Return index where an object with given key should be inserted
   * @param key
   */
  shouldBeAt(key: K): number {
    if (this._array.length === 0) return 0;

    // Search ordered index
    const [idx,] = this._searchOne(key);
    if (this._comparator(this._extractor(this._array[idx]), key) <= 0) {
      return idx + 1;
    }

    return idx;
  }

  /**
   * Returns the nearest stored element according to the given mode
   * @param key
   * @param mode
   */
  nearest(key: K, mode: 'lt' | 'lte' | 'gte' | 'gt'): T | null {
    if (this._array.length === 0) return null;

    // Search ordered index
    const [idx,] = this._searchOne(key);

    // - before
    if (mode === 'lt' || mode === 'lte') {
      const validate = NEAREST_VALIDATOR[mode];

      for (let i = idx; i >= 0; --i) {
        const obj = this._array[i];

        if (validate(this._comparator(this._extractor(obj), key))) {
          return obj;
        }
      }
    }

    if (mode === 'gt' || mode === 'gte') {
      const validate = NEAREST_VALIDATOR[mode];

      for (let i = idx; i < this._array.length; ++i) {
        const obj = this._array[i];

        if (validate(this._comparator(this._extractor(obj), key))) {
          return obj;
        }
      }
    }

    return null;
  }

  /**
   * Return all objects matching the given key
   * @param key
   */
  search(key: K): T[] {
    // Gather all results
    const res: T[] = [];

    for (const [,obj] of this._searchAll(key)) {
      res.push(obj);
    }

    return res;
  }

  // - modifying
  /**
   * Indicates that keys have changed.
   * It will re-sort the whole tree.
   */
  updatedKeys(): void {
    this._array.sort((a, b) => this._comparator(this._extractor(a), this._extractor(b)));
  }

  /**
   * Adds a new element to the tree
   * @param elem
   * @param mode
   */
  insert(elem: T, mode: InsertMode = 'anywhere'): T {
    if (this.length === 0) {
      this._array.push(elem);
    } else {
      const key = this._extractor(elem);
      let idx = this.shouldBeAt(key);

      if (mode === 'before') {
        for (; idx > 0; --idx) {
          const obj = this._array[idx - 1];

          if (this._comparator(this._extractor(obj), key) < 0) {
            break;
          }
        }
      } else if (mode === 'after') {
        for (; idx < this._array.length; ++idx) {
          const obj = this._array[idx];

          if (this._comparator(this._extractor(obj), key) > 0) {
            break;
          }
        }
      }

      this._array.splice(idx, 0, elem);
    }

    return elem;
  }

  /**
   * Removes all elements
   */
  clear(): void {
    this._array = [];
  }

  /**
   * Removes all elements matching the key.
   *
   * @param key
   * @returns removed elements
   */
  remove(key: K): T[] {
    const removed: T[] = [];

    for (const [idx, obj] of this._searchAll(key)) {
      this._array.splice(idx, 1);
      removed.push(obj);
    }

    return removed;
  }

  /**
   * Removes all elements before the one matching the key (excluded).
   *
   * @param key
   * @returns removed elements
   */
  removeUntil(key: K): T[] {
    if (this._array.length === 0) {
      return [];
    }

    // Search ordered index
    let [idx,] = this._searchOne(key);

    for (; idx > 0; idx--) {
      const obj = this._array[idx];

      if (this._comparator(this._extractor(obj), key) < 0) {
        break;
      }
    }

    return this._array.splice(0, idx + 1);
  }

  /**
   * Removes and return last object
   */
  pop(): T | null {
    return this._array.pop() ?? null;
  }

  // - iterate
  *[Symbol.iterator]() {
    yield* this._array;
  }

  filter(predicate: (elem: T, index: number) => boolean): BST<T, K> {
    const filtered: T[] = [];

    for (let i = 0; i < this.length; ++i) {
      const elem = this.item(i);
      if (predicate(elem, i)) filtered.push(elem);
    }

    return new BST(this._extractor, this._comparator, filtered);
  }

  map<R>(fn: (elem: T, index: number) => R): R[] {
    return this._array.map(fn);
  }

  reduce<R>(fn: (acc: R, elem: T) => R, init: R): R {
    return this._array.reduce(fn, init);
  }

  // Properties
  get array(): T[] {
    return Array.from(this._array);
  }

  get length() {
    return this._array.length;
  }
}
