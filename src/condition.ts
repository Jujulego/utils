import { Listenable, Observable, source$ } from 'kyrielle';
import { group$ } from 'kyrielle/events';
import { waitFor$ } from 'kyrielle/subscriptions';

// Types
export type ConditionEventMap = {
  true: true;
  false: false;
};

// Class
export class Condition implements Observable<boolean>, Listenable<ConditionEventMap> {
  // Attributes
  private _value: boolean;
  private _events = group$({
    'true': source$<true>(),
    'false': source$<false>(),
  });

  // Constructor
  constructor(readonly condition: () => boolean) {
    this._value = condition();
  }

  // Methods
  readonly on = this._events.on;
  readonly off = this._events.off;
  readonly subscribe = this._events.subscribe;
  readonly unsubscribe = this._events.unsubscribe;
  readonly eventKeys = this._events.eventKeys;
  readonly clear = this._events.clear;

  check(): void {
    this._value = this.condition();
    this._events.emit(`${this._value}`, this._value);
  }

  async waitFor(value: boolean): Promise<void> {
    while (this._value !== value) {
      await waitFor$(this._events, `${value}`);
    }
  }

  // Properties
  get value() {
    return this._value;
  }
}
