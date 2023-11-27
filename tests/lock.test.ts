import { vi } from 'vitest';

import { Lock } from '@/src/lock.js';

// Setup
let lock: Lock;

beforeEach(() => {
  lock = new Lock();
});

// Tests
describe('Lock', () => {
  it('should be free at start', () => {
    expect(lock.locked).toBe(false);
  });

  it('should return immediately if not locked', () => {
    expect(lock.acquire()).toBeDefined();
    expect(lock.locked).toBe(true);
  });

  it('should acquire before calling fn and release it after', async () => {
    const fn = vi.fn(() => {
      expect(lock.locked).toBe(true);
      return 'test';
    });

    await expect(lock.with(fn)).resolves.toBe('test');

    expect(fn).toHaveBeenCalled();
    expect(lock.locked).toBe(false);
  });

  it('should call fn only once at a time', async () => {
    let v = 0;

    const fn = vi.fn(async () => {
      try {
        ++v;
        expect(lock.locked).toBe(true);

        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(lock.locked).toBe(true);
        expect(v).toBe(1);
      } finally {
        --v;
      }
    });

    await Promise.all([lock.with(fn), lock.with(fn), lock.with(fn)]);

    expect(fn).toHaveBeenCalledTimes(3);
    expect(v).toBe(0);
  });

  it('should release lock if fn fails', async () => {
    const fn = vi.fn(() => {
      expect(lock.locked).toBe(true);
      throw new Error('failed');
    });

    await expect(lock.with(fn)).rejects.toEqual(new Error('failed'));

    expect(fn).toHaveBeenCalled();
    expect(lock.locked).toBe(false);
  });
});
