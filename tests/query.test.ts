import { Listener } from '@jujulego/event-tree';

import { Query, queryfy, QueryState, QueryStateDone, QueryStateFailed } from '@/src/query';

// Utils
async function flushPromises() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

// Setup
let query: Query<number>;

let resultSpy: Listener<QueryStateDone<number> | QueryStateFailed>;

beforeEach(() => {
  // Initiate
  query = new Query();

  // Events
  resultSpy = jest.fn();
  query.subscribe(resultSpy);
});

// Tests
describe('new Query', () => {
  it('should be pending at start', () => {
    expect(query.state).toEqual({
      status: 'pending'
    });

    expect(query.status).toBe('pending');
    expect(query.data).toBeUndefined();
    expect(query.error).toBeUndefined();
  });

  it('should use given AbortController', () => {
    const ctrl = new AbortController();
    const query = new Query(ctrl);

    expect(query.controller).toBe(ctrl);
  });
});

describe('Query.done', () => {
  it('should change query state', () => {
    query.done(42);

    expect(query.state).toEqual({
      status: 'done',
      data: 42
    });

    expect(query.status).toBe('done');
    expect(query.data).toBe(42);
    expect(query.error).toBeUndefined();
  });

  it('should emit done state', () => {
    query.done(42);

    expect(resultSpy).toHaveBeenCalledWith({
      status: 'done',
      data: 42
    });
  });
});

describe('Query.fail', () => {
  let error: Error;

  beforeEach(() => {
    error = new Error('Life purpose not found');
  });

  it('should change query state', () => {
    query.fail(error);

    expect(query.state).toEqual({
      status: 'failed',
      error
    });

    expect(query.status).toBe('failed');
    expect(query.data).toBeUndefined();
    expect(query.error).toBe(error);
  });

  it('should emit failed state', () => {
    query.fail(error);

    expect(resultSpy).toHaveBeenCalledWith({
      status: 'failed',
      error
    });
  });
});

describe('Query.then', () => {
  it('should pass original controller to created query', () => {
    const created = query.then();

    expect(created.controller).toBe(query.controller);
  });

  describe('pending => done', () => {
    it('should resolve to result', async () => {
      setTimeout(() => query.done(42));

      await expect(query).resolves.toBe(42);
    });

    it('should call onFulfilled callback', () => {
      const onFulfilled = jest.fn<void, [number]>();
      const onRejected = jest.fn<void, [Error]>();
      query.then(onFulfilled, onRejected);

      query.done(42);

      expect(onFulfilled).toHaveBeenCalledWith(42);
      expect(onRejected).not.toHaveBeenCalled();
    });

    it('should return a linked query, resolving to the same result', () => {
      const res = query.then();

      expect(res).toBeInstanceOf(Query);
      expect(res.status).toBe('pending');

      const spy: Listener<QueryState> = jest.fn();
      res.subscribe(spy);

      query.done(42);

      expect(res.status).toBe('done');
      expect(res.data).toBe(42);

      expect(spy).toHaveBeenCalledWith({
        status: 'done',
        data: 42,
      });
    });

    it('should return a linked query, resolving to the result of callback', () => {
      const res = query.then((val) => val === 42);

      expect(res).toBeInstanceOf(Query);
      expect(res.status).toBe('pending');

      const spy: Listener<QueryState> = jest.fn();
      res.subscribe(spy);

      query.done(42);

      expect(res.status).toBe('done');
      expect(res.data).toBe(true);

      expect(spy).toHaveBeenCalledWith({
        status: 'done',
        data: true,
      });
    });

    it('should return a linked query, resolving to the resolved value from callback', async () => {
      const res = query.then(async (val) => val === 42);

      expect(res).toBeInstanceOf(Query);
      expect(res.status).toBe('pending');

      query.done(42);
      await flushPromises();

      expect(res.status).toBe('done');
      expect(res.data).toBe(true);
    });

    it('should return a linked query, rejecting to the error from callback', () => {
      const res = query.then(() => {
        throw new Error('Wrong life purpose');
      });

      expect(res).toBeInstanceOf(Query);
      expect(res.status).toBe('pending');

      const spy: Listener<QueryState> = jest.fn();
      res.subscribe(spy);

      query.done(25);

      expect(res.status).toBe('failed');
      expect(res.error).toEqual(new Error('Wrong life purpose'));

      expect(spy).toHaveBeenCalledWith({
        status: 'failed',
        error: new Error('Wrong life purpose'),
      });
    });

    it('should return a linked query, rejecting to the rejected error from callback', async () => {
      const res = query.then(async () => {
        throw new Error('Wrong life purpose');
      });

      expect(res).toBeInstanceOf(Query);
      expect(res.status).toBe('pending');

      const spy: Listener<QueryState> = jest.fn();
      res.subscribe(spy);

      query.done(25);
      await flushPromises();

      expect(res.status).toBe('failed');
      expect(res.error).toEqual(new Error('Wrong life purpose'));

      expect(spy).toHaveBeenCalledWith({
        status: 'failed',
        error: new Error('Wrong life purpose'),
      });
    });
  });

  describe('already in done status', () => {
    it('should resolve to result', async () => {
      query.done(42);

      await expect(query).resolves.toBe(42);
    });

    it('should call onFulfilled callback', async () => {
      query.done(42);

      const onFulfilled = jest.fn<void, [number]>();
      const onRejected = jest.fn<void, [Error]>();
      query.then(onFulfilled, onRejected);

      await flushPromises();

      expect(onFulfilled).toHaveBeenCalledWith(42);
      expect(onRejected).not.toHaveBeenCalled();
    });

    it('should return a linked query, resolving to the same result', async () => {
      query.done(42);

      const res = query.then();

      expect(res).toBeInstanceOf(Query);
      expect(res.status).toBe('pending');

      const spy: Listener<QueryState> = jest.fn();
      res.subscribe(spy);

      await flushPromises();

      expect(res.status).toBe('done');
      expect(res.data).toBe(42);

      expect(spy).toHaveBeenCalledWith({
        status: 'done',
        data: 42,
      });
    });

    it('should return a linked query, resolving to the result of callback', async () => {
      query.done(42);

      const res = query.then((val) => val === 42);

      expect(res).toBeInstanceOf(Query);
      expect(res.status).toBe('pending');

      const spy: Listener<QueryState> = jest.fn();
      res.subscribe(spy);

      await flushPromises();

      expect(res.status).toBe('done');
      expect(res.data).toBe(true);

      expect(spy).toHaveBeenCalledWith({
        status: 'done',
        data: true,
      });
    });

    it('should return a linked query, resolving to the resolved value from callback', async () => {
      query.done(42);

      const res = query.then(async (val) => val === 42);

      expect(res).toBeInstanceOf(Query);
      expect(res.status).toBe('pending');

      await flushPromises();

      expect(res.status).toBe('done');
      expect(res.data).toBe(true);
    });

    it('should return a linked query, rejecting to the error from callback', async () => {
      query.done(25);

      const res = query.then(() => {
        throw new Error('Wrong life purpose');
      });

      expect(res).toBeInstanceOf(Query);
      expect(res.status).toBe('pending');

      const spy: Listener<QueryState> = jest.fn();
      res.subscribe(spy);

      await flushPromises();

      expect(res.status).toBe('failed');
      expect(res.error).toEqual(new Error('Wrong life purpose'));

      expect(spy).toHaveBeenCalledWith({
        status: 'failed',
        error: new Error('Wrong life purpose'),
      });
    });

    it('should return a linked query, rejecting to the rejected error from callback', async () => {
      query.done(25);

      const res = query.then(async () => {
        throw new Error('Wrong life purpose');
      });

      expect(res).toBeInstanceOf(Query);
      expect(res.status).toBe('pending');

      const spy: Listener<QueryState> = jest.fn();
      res.subscribe(spy);

      await flushPromises();

      expect(res.status).toBe('failed');
      expect(res.error).toEqual(new Error('Wrong life purpose'));

      expect(spy).toHaveBeenCalledWith({
        status: 'failed',
        error: new Error('Wrong life purpose'),
      });
    });
  });

  describe('pending => failed', () => {
    let error: Error;

    beforeEach(() => {
      error = new Error('Life purpose not found');
    });

    it('should rejects to error', async () => {
      setTimeout(() => query.fail(error));

      await expect(query).rejects.toBe(error);
    });

    it('should call onRejected callback', () => {
      const onFulfilled = jest.fn<void, [number]>();
      const onRejected = jest.fn<void, [Error]>();
      query.then(onFulfilled, onRejected);

      query.fail(error);

      expect(onFulfilled).not.toHaveBeenCalled();
      expect(onRejected).toHaveBeenCalledWith(error);
    });

    it('should return a linked query, rejecting to the same error', () => {
      const res = query.then();

      expect(res).toBeInstanceOf(Query);
      expect(res.status).toBe('pending');

      const spy: Listener<QueryState> = jest.fn();
      res.subscribe(spy);

      query.fail(error);

      expect(res.status).toBe('failed');
      expect(res.error).toBe(error);

      expect(spy).toHaveBeenCalledWith({
        status: 'failed',
        error,
      });
    });

    it('should return a linked query, resolving to the result of callback', () => {
      const res = query.then(null, () => 42);

      expect(res).toBeInstanceOf(Query);
      expect(res.status).toBe('pending');

      const spy: Listener<QueryState> = jest.fn();
      res.subscribe(spy);

      query.fail(error);

      expect(res.status).toBe('done');
      expect(res.data).toBe(42);

      expect(spy).toHaveBeenCalledWith({
        status: 'done',
        data: 42,
      });
    });

    it('should return a linked query, resolving to the resolved value from callback', async () => {
      const res = query.then(null, async () => 42);

      expect(res).toBeInstanceOf(Query);
      expect(res.status).toBe('pending');

      query.fail(error);
      await flushPromises();

      expect(res.status).toBe('done');
      expect(res.data).toBe(42);
    });

    it('should return a linked query, rejecting to the error from callback', () => {
      const res = query.then(null, () => {
        throw new Error('Wrong life purpose');
      });

      expect(res).toBeInstanceOf(Query);
      expect(res.status).toBe('pending');

      const spy: Listener<QueryState> = jest.fn();
      res.subscribe(spy);

      query.fail(error);

      expect(res.status).toBe('failed');
      expect(res.error).toEqual(new Error('Wrong life purpose'));

      expect(spy).toHaveBeenCalledWith({
        status: 'failed',
        error: new Error('Wrong life purpose'),
      });
    });

    it('should return a linked query, rejecting to the rejected error from callback', async () => {
      const res = query.then(null, async () => {
        throw new Error('Wrong life purpose');
      });

      expect(res).toBeInstanceOf(Query);
      expect(res.status).toBe('pending');

      const spy: Listener<QueryState> = jest.fn();
      res.subscribe(spy);

      query.fail(error);
      await flushPromises();

      expect(res.status).toBe('failed');
      expect(res.error).toEqual(new Error('Wrong life purpose'));

      expect(spy).toHaveBeenCalledWith({
        status: 'failed',
        error: new Error('Wrong life purpose'),
      });
    });
  });

  describe('already in failed status', () => {
    let error: Error;

    beforeEach(() => {
      error = new Error('Life purpose not found');
    });

    it('should resolve to result', async () => {
      query.fail(error);

      await expect(query).rejects.toBe(error);
    });

    it('should call onRejected callback', async () => {
      query.fail(error);

      const onFulfilled = jest.fn<void, [number]>();
      const onRejected = jest.fn<void, [Error]>();
      query.then(onFulfilled, onRejected);

      await flushPromises();

      expect(onFulfilled).not.toHaveBeenCalled();
      expect(onRejected).toHaveBeenCalledWith(error);
    });

    it('should return a linked query, resolving to the same result', async () => {
      query.fail(error);

      const res = query.then();

      expect(res).toBeInstanceOf(Query);
      expect(res.status).toBe('pending');

      const spy: Listener<QueryState> = jest.fn();
      res.subscribe(spy);

      await flushPromises();

      expect(res.status).toBe('failed');
      expect(res.error).toBe(error);

      expect(spy).toHaveBeenCalledWith({
        status: 'failed',
        error,
      });
    });

    it('should return a linked query, resolving to the result of callback', async () => {
      query.fail(error);

      const res = query.then(null, () => 42);

      expect(res).toBeInstanceOf(Query);
      expect(res.status).toBe('pending');

      const spy: Listener<QueryState> = jest.fn();
      res.subscribe(spy);

      await flushPromises();

      expect(res.status).toBe('done');
      expect(res.data).toBe(42);

      expect(spy).toHaveBeenCalledWith({
        status: 'done',
        data: 42,
      });
    });

    it('should return a linked query, resolving to the resolved value from callback', async () => {
      query.fail(error);

      const res = query.then(null, async () => 42);

      expect(res).toBeInstanceOf(Query);
      expect(res.status).toBe('pending');

      await flushPromises();

      expect(res.status).toBe('done');
      expect(res.data).toBe(42);
    });

    it('should return a linked query, rejecting to the error from callback', async () => {
      query.fail(error);

      const res = query.then(null, () => {
        throw new Error('Wrong life purpose');
      });

      expect(res).toBeInstanceOf(Query);
      expect(res.status).toBe('pending');

      const spy: Listener<QueryState> = jest.fn();
      res.subscribe(spy);

      await flushPromises();

      expect(res.status).toBe('failed');
      expect(res.error).toEqual(new Error('Wrong life purpose'));

      expect(spy).toHaveBeenCalledWith({
        status: 'failed',
        error: new Error('Wrong life purpose'),
      });
    });

    it('should return a linked query, rejecting to the rejected error from callback', async () => {
      query.fail(error);

      const res = query.then(null, async () => {
        throw new Error('Wrong life purpose');
      });

      expect(res).toBeInstanceOf(Query);
      expect(res.status).toBe('pending');

      const spy: Listener<QueryState> = jest.fn();
      res.subscribe(spy);

      await flushPromises();

      expect(res.status).toBe('failed');
      expect(res.error).toEqual(new Error('Wrong life purpose'));

      expect(spy).toHaveBeenCalledWith({
        status: 'failed',
        error: new Error('Wrong life purpose'),
      });
    });
  });
});

describe('Query.cancel', () => {
  it('should call abort on controller', () => {
    const err = new Error('Cancel !');
    jest.spyOn(query.controller, 'abort');

    query.cancel(err);
    expect(query.controller.abort).toHaveBeenCalledWith(err);

    query.done(42);
    expect(resultSpy).not.toHaveBeenCalled();
  });
});

describe('queryfy', () => {
  it('should return a query wrapping given successful promise', async () => {
    const prom = new Promise<number>((resolve) => setTimeout(() => resolve(42), 0));
    const query = queryfy(prom);

    await prom;

    expect(query.state).toEqual({
      status: 'done',
      data: 42,
    });
  });

  it('should return a query wrapping given failing promise', async () => {
    const prom = new Promise<number>((_, reject) => setTimeout(() => reject(new Error('Failed !')), 0));
    const query = queryfy(prom);

    await prom.catch(() => null);

    expect(query.state).toEqual({
      status: 'failed',
      error: new Error('Failed !'),
    });
  });

  it('should return given query', () => {
    expect(queryfy(query)).toBe(query);
  });
});