import util from 'node:util';

import { Lock } from '../src';

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
