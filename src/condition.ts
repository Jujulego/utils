import { group, IListenable, IObservable, source, waitFor } from '@jujulego/event-tree';

// Class
export class Condition implements IObservable<boolean>, IListenable<{ 'true': true, 'false': false }> {
  // Attributes
  private _value: boolean;
  private _events = group({
    'true': source<true>(),
    'false': source<false>(),
  });

  // Constructor
  constructor(readonly condition: () => boolean) {
    this._value = condition();
  }

  // Methods
  on = this._events.on;
  off = this._events.off;
  subscribe = this._events.subscribe;
  unsubscribe = this._events.unsubscribe;

  check(): void {
    this._value = this.condition();
    this._events.emit(`${this._value}`, this._value);
  }

  async waitFor(value: boolean): Promise<void> {
    while (this._value !== value) {
      await waitFor(this._events, `${value}`);
    }
  }

  // Properties
  get value() {
    return this._value;
  }
}
