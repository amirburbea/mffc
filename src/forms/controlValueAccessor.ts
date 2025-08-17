import { effect, isSignal, Signal, signal, WritableSignal } from '@angular/core';
import { AbstractControl, ControlValueAccessor } from '@angular/forms';

import { touchedSignal, valueSignal } from './controlSignals';

/**
 * Factory for `ControlValueAccessor`.
 */
export function controlValueAccessor<TValue>({
  touched,
  value,
  setDisabledState,
}: ControlValueAccessorOptions<TValue>): ControlValueAccessor {
  const onTouched = signal<(() => void) | undefined>(undefined);
  const onChange = signal<((value: unknown) => void) | undefined>(undefined);
  const isTouched = isControl(touched) ? touchedSignal(touched) : touched;
  effect(() => {
    if (isTouched()) {
      onTouched()?.();
    }
  });
  const readValue = isSignal(value) ? value : valueSignal(value);
  effect(() => {
    onChange()?.(readValue());
  });
  return {
    registerOnChange: onChange.set,
    registerOnTouched: onTouched.set,
    writeValue: (isSignal(value) ? value.set : value.setValue).bind(value),
    setDisabledState,
  };
}

/**
 * Options for the `controlValueAccessor` factory.
 */
export interface ControlValueAccessorOptions<TValue> {
  /**
   * The source for reporting the component as being touched.
   *
   * The source can be a signal, or  a control - in the case where an inner
   * control is the source of the touched state.
   */
  readonly touched: AbstractControl | Signal<boolean>;
  /**
   * Signal (or inner control) to use for getting and setting the value.
   */
  readonly value: AbstractControl<TValue> | WritableSignal<TValue>;
  /**
   * Optional function that is called by the forms API when the control status
   * changes to or from 'DISABLED'.
   */
  readonly setDisabledState?: (disabled: boolean) => void;
}

function isControl(value: unknown): value is AbstractControl {
  return value instanceof AbstractControl;
}
