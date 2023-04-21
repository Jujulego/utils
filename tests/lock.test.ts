import util from 'node:util';

import { Lock } from '@/src/lock';

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

  it('should be acquired if not locked', async () => {
    await expect(lock.acquire()).resolves.toBeUndefined();
    expect(lock.locked).toBe(true);
  });

  it('should block next acquires until release is called', async () => {
    await lock.acquire();
    const prom = lock.acquire();

    // prom should still be pending
    expect(util.inspect(prom)).toMatch(/pending/);

    // release lock
    lock.release();
    expect(lock.locked).toBe(false);

    await expect(prom).resolves.toBeUndefined();
    expect(lock.locked).toBe(true);
  });
});

describe('Lock.with', () => {
  it('should acquire before calling fn and release it after', async () => {
    const fn = jest.fn(() => {
      expect(lock.locked).toBe(true);
      return 'test';
    });

    await expect(lock.with(fn)).resolves.toBe('test');

    expect(fn).toHaveBeenCalled();
    expect(lock.locked).toBe(false);
  });

  it('should release lock if fn fails', async () => {
    const fn = jest.fn(() => {
      expect(lock.locked).toBe(true);
      throw new Error('failed');
    });

    await expect(lock.with(fn)).rejects.toEqual(new Error('failed'));

    expect(fn).toHaveBeenCalled();
    expect(lock.locked).toBe(false);
  });
});
