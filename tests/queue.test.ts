import { Queue } from '@/src/queue';

// Tests
describe('Queue.pop', () => {
  it('should pop all items in FIFO order', async () => {
    const queue = new Queue<number>();
    queue.insert(1);
    queue.insert(2);
    queue.insert(3);

    await expect(queue.pop()).resolves.toBe(1);
    await expect(queue.pop()).resolves.toBe(2);
    await expect(queue.pop()).resolves.toBe(3);

    expect(queue).toHaveLength(0);
  });

  it('should wait until a new item is inserted', async () => {
    const queue = new Queue<number>();
    setTimeout(() => queue.insert(42), 0);

    await expect(queue.pop()).resolves.toBe(42);
  });

  it('should return undefined if queue is empty', () => {
    const queue = new Queue<number>();

    expect(queue.pop({ sync: true })).toBeUndefined();
  });
});

describe('Queue iterator', () => {
  it('should pop all items in FIFO order', () => {
    const queue = new Queue<number>();
    queue.insert(1);
    queue.insert(2);
    queue.insert(3);

    expect(Array.from(queue)).toEqual([1, 2, 3]);

    expect(queue).toHaveLength(0);
  });
});

describe('Queue async iterator', () => {
  it('should pop all items in FIFO order', async () => {
    const queue = new Queue<number>();
    queue.insert(1);
    queue.insert(2);
    queue.insert(3);

    const it = queue[Symbol.asyncIterator]();

    await expect(it.next()).resolves.toEqual({ value: 1 });
    await expect(it.next()).resolves.toEqual({ value: 2 });
    await expect(it.next()).resolves.toEqual({ value: 3 });

    expect(queue).toHaveLength(0);
  });

  it('should wait until a new item is inserted', async () => {
    const queue = new Queue<number>();
    setTimeout(() => queue.insert(42), 0);

    const it = queue[Symbol.asyncIterator]();

    await expect(it.next()).resolves.toEqual({ value: 42 });
  });
});
