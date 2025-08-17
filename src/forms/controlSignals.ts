import { Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl, TouchedChangeEvent } from '@angular/forms';
import { identity } from 'rxjs';
import { filter, map } from 'rxjs/operators';

export function disabledSignal({ disabled, statusChanges }: AbstractControl): Signal<boolean> {
  return toSignal(statusChanges.pipe(map((status) => status === 'DISABLED')), {
    initialValue: disabled,
  });
}

export function touchedSignal({ events, touched }: AbstractControl): Signal<boolean> {
  return toSignal(
    events.pipe(
      filter((event) => event instanceof TouchedChangeEvent),
      map(({ touched }) => touched),
    ),
    { initialValue: touched },
  );
}

export function valueSignal<T>(control: AbstractControl<T>): Signal<T>;
export function valueSignal<R, T>(
  control: AbstractControl<T>,
  transform: (value: T) => R,
): Signal<R>;
export function valueSignal(
  { value, valueChanges }: AbstractControl,
  transform: (value: unknown) => unknown = identity,
) {
  return toSignal(valueChanges.pipe(map(transform)), { initialValue: transform(value) });
}
