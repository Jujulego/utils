import { group, IListenable, IObservable, once, source } from '@jujulego/event-tree';

// Types
export interface QueryStatePending {
  readonly status: 'pending';
}

export interface QueryStateDone<D> {
  readonly status: 'done';
  readonly data: D;
}

export interface QueryStateFailed {
  readonly status: 'failed';
  readonly error: Error;
}

export type QueryState<D = unknown> = QueryStatePending | QueryStateDone<D> | QueryStateFailed;
export type QueryStatus = QueryState['status'];

export type QueryEventMap<D> = {
  done: QueryStateDone<D>;
  failed: QueryStateFailed;
}

// Utils
function callbackify<T>(prom: T | PromiseLike<T>, query: Query<T>) {
  if (prom && typeof prom === 'object' && 'then' in prom) {
    prom.then((res) => query.done(res), (err) => query.fail(err));
  } else {
    query.done(prom);
  }
}

// Class
/**
 * Represents a data query.
 *
 * A query can be in 3 three status:
 * - pending: the query is running
 * - done: the query ended successfully, result is then accessible in the data attribute
 * - failed: the query failed, the error attribute has some details
 *
 * An event is emitted when the query's status changes, with the new query state in the payload.
 */
export class Query<D = unknown> implements IListenable<QueryEventMap<D>>, IObservable<QueryStateDone<D> | QueryStateFailed>, PromiseLike<D> {
  // Attributes
  private _state: QueryState<D> = { status: 'pending' };

  private _events = group({
    'done': source<QueryStateDone<D>>(),
    'failed': source<QueryStateFailed>(),
  });

  // Constructor
  constructor(
    readonly controller = new AbortController(),
  ) {
    controller.signal.addEventListener('abort', () => this._events.clear());
  }

  // Methods
  readonly on = this._events.on;
  readonly off = this._events.off;
  readonly subscribe = this._events.subscribe;
  readonly unsubscribe = this._events.unsubscribe;
  readonly clear = this._events.clear;

  then<RF = D, RR = never>(
    onFulfilled?: ((value: D) => PromiseLike<RF> | RF) | null,
    onRejected?: ((reason: Error) => PromiseLike<RR> | RR) | null,
  ): Query<RF | RR> {
    const result = new Query<RF | RR>(this.controller);

    const listener = (state: QueryState<D>) => {
      try {
        switch (state.status) {
          case 'done':
            if (onFulfilled) {
              callbackify(onFulfilled(state.data), result);
            } else {
              result.done(state.data as unknown as RF);
            }

            break;

          case 'failed':
            if (onRejected) {
              callbackify(onRejected(state.error), result);
            } else {
              result.fail(state.error);
            }

            break;
        }
      } catch (err) {
        result.fail(err as Error);
      }
    };

    if (this._state.status === 'pending') {
      once(this, listener);
    } else {
      // Gives time to subscribe to result query
      queueMicrotask(() => listener(this._state));
    }

    return result;
  }

  /**
   * Mark query as done, and store its result
   * @param data result of the query
   */
  done(data: D): void {
    this._state = { status: 'done', data };

    this._events.emit('done', this._state);
  }

  /**
   * Mark query as failed
   * @param error cause of the failure
   */
  fail(error: Error): void {
    this._state = { status: 'failed', error };

    this._events.emit('failed', this._state);
  }

  /**
   * Cancel query using its AbortController.
   * Also clear all listeners.
   *
   * @param reason
   */
  cancel(reason?: Error): void {
    this.controller.abort(reason);
  }

  // Properties
  /**
   * Current state of query
   */
  get state(): QueryState<D> {
    return this._state;
  }

  /**
   * Current status of the query
   */
  get status(): QueryStatus {
    return this._state.status;
  }

  /**
   * Result of the query, if its "done", else returns undefined
   */
  get data(): D | undefined {
    return this._state.status === 'done' ? this._state.data : undefined;
  }

  /**
   * Cause of query's failure, if its "failed", else returns undefined
   */
  get error(): Error | undefined {
    return this._state.status === 'failed' ? this._state.error : undefined;
  }
}

// Utils
/**
 * Builds a query from a given promise.
 * Query will be done when promise resolves, and failed when promise rejects
 *
 * @param promise
 * @param controller
 */
export function queryfy<D>(promise: PromiseLike<D>, controller?: AbortController): Query<D> {
  if (promise instanceof Query) {
    return promise;
  }

  const query = new Query<D>(controller);
  promise.then((data) => query.done(data), (error) => query.fail(error));

  return query;
}
