import { group, IListenable, IObservable, source } from '@jujulego/event-tree';

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
  'done': QueryStateDone<D>,
  'failed': QueryStateFailed,
}

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
export class Query<D = unknown> implements IListenable<QueryEventMap<D>>, IObservable<QueryStateDone<D> | QueryStateFailed> {
  // Attributes
  private _state: QueryState<D> = { status: 'pending' };
  private _events = group({
    'done': source<QueryStateDone<D>>(),
    'failed': source<QueryStateFailed>(),
  });

  // Methods
  on = this._events.on;
  off = this._events.off;
  subscribe = this._events.subscribe;
  unsubscribe = this._events.unsubscribe;

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
