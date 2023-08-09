import { PriorityQueue } from '@/src/priority-queue.js';

// Tests
describe('PriorityQueue.pop', () => {
  it('should pop all items in highest priority order', async () => {
    const queue = new PriorityQueue<string>();
    queue.insert('a', 3);
    queue.insert('b', 1);
    queue.insert('c', 2);

    await expect(queue.pop()).resolves.toBe('a');
    await expect(queue.pop()).resolves.toBe('c');
    await expect(queue.pop()).resolves.toBe('b');

    expect(queue).toHaveLength(0);
  });

  it('should pop all items in lowest priority order', async () => {
    const queue = new PriorityQueue<string>('lowest');
    queue.insert('a', 3);
    queue.insert('b', 1);
    queue.insert('c', 2);

    await expect(queue.pop()).resolves.toBe('b');
    await expect(queue.pop()).resolves.toBe('c');
    await expect(queue.pop()).resolves.toBe('a');

    expect(queue).toHaveLength(0);
  });

  it('should wait until a new item is inserted', async () => {
    const queue = new PriorityQueue<number>();
    setTimeout(() => queue.insert(42), 0);

    await expect(queue.pop()).resolves.toBe(42);
  });

  it('should return undefined if queue is empty', () => {
    const queue = new PriorityQueue<number>();

    expect(queue.pop({ sync: true })).toBeUndefined();
  });
});

describe('PriorityQueue iterator', () => {
  it('should pop all items in highest priority order', () => {
    const queue = new PriorityQueue<string>();
    queue.insert('a', 3);
    queue.insert('b', 1);
    queue.insert('c', 2);

    expect(Array.from(queue)).toEqual(['a', 'c', 'b']);

    expect(queue).toHaveLength(0);
  });

  it('should pop all items in lowest priority order', () => {
    const queue = new PriorityQueue<string>('lowest');
    queue.insert('a', 3);
    queue.insert('b', 1);
    queue.insert('c', 2);

    expect(Array.from(queue)).toEqual(['b', 'c', 'a']);

    expect(queue).toHaveLength(0);
  });
});

describe('Queue async iterator', () => {
  it('should pop all items in highest priority order', async () => {
    const queue = new PriorityQueue<string>();
    queue.insert('a', 3);
    queue.insert('b', 1);
    queue.insert('c', 2);

    const it = queue[Symbol.asyncIterator]();

    await expect(it.next()).resolves.toEqual({ value: 'a' });
    await expect(it.next()).resolves.toEqual({ value: 'c' });
    await expect(it.next()).resolves.toEqual({ value: 'b' });

    expect(queue).toHaveLength(0);
  });

  it('should pop all items in lowest priority order', async () => {
    const queue = new PriorityQueue<string>('lowest');
    queue.insert('a', 3);
    queue.insert('b', 1);
    queue.insert('c', 2);

    const it = queue[Symbol.asyncIterator]();

    await expect(it.next()).resolves.toEqual({ value: 'b' });
    await expect(it.next()).resolves.toEqual({ value: 'c' });
    await expect(it.next()).resolves.toEqual({ value: 'a' });

    expect(queue).toHaveLength(0);
  });

  it('should wait until a new item is inserted', async () => {
    const queue = new PriorityQueue<number>();
    setTimeout(() => queue.insert(42), 0);

    const it = queue[Symbol.asyncIterator]();

    await expect(it.next()).resolves.toEqual({ value: 42 });
  });
});
