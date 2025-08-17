import { FocusMonitor } from '@angular/cdk/a11y';
import {
  computed,
  effect,
  ElementRef,
  inject,
  isSignal,
  signal,
  Signal,
  WritableSignal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl, NgControl, Validators } from '@angular/forms';
import { MatFormFieldControl } from '@angular/material/form-field';
import { Subject } from 'rxjs';
import { map } from 'rxjs/operators';

import { disabledSignal, valueSignal } from './controlSignals';

/**
 * Factory for `MatFormFieldControl<T>`.
 */
export function matFormFieldControl<TValue>({
  controlType,
  disabled,
  id,
  isEmpty,
  onContainerClick = () => {},
  placeholder,
  required,
  setAriaDescribedBy,
  value,
}: MatFormFieldControlOptions<TValue>): MatFormFieldControl<TValue> {
  const { nativeElement } = inject<ElementRef<HTMLElement>>(ElementRef);
  const isFocused = toSignal(
    inject(FocusMonitor)
      .monitor(nativeElement, true)
      .pipe(map((origin) => !!origin)),
    { initialValue: false },
  );
  const getDisabled = isControl(disabled) ? disabledSignal(disabled) : disabled;
  const getId = isFunction(id)
    ? id
    : () => (isString(id) ? id : (id.nativeElement.getAttribute('id') ?? ''));
  const getValue = isSignal(value) ? value : valueSignal(value);
  const getIsEmpty = isEmpty ?? computed(() => !getValue());
  const ngControl = inject(NgControl, { self: true, optional: true });
  // Add a check for the form control having a required validator.
  if (isControl(ngControl?.control)) {
    const originalRequired = required;
    const { control } = ngControl;
    required = () => control.hasValidator(Validators.required) || !!originalRequired?.();
  }
  const describedByIds = signal((nativeElement.getAttribute('aria-described-by') ?? '').split(' '));
  // Watch a set of triggers in an effect, but use `arrayEquals` in a `computed` first.
  const triggers = computed(
    () => [
      getId(),
      isFocused(),
      getIsEmpty(),
      getDisabled(),
      getValue(),
      required?.(),
      describedByIds().join(' '),
    ],
    { equal: arrayEquals },
  );
  const stateChanges = new Subject<void>();
  effect(() => {
    triggers();
    stateChanges.next();
  });
  const setValue = isSignal(value) ? value.set : value.setValue.bind(value);
  return {
    controlType,
    get disabled() {
      return getDisabled();
    },
    get empty() {
      return getIsEmpty();
    },
    get errorState() {
      return !!(ngControl?.invalid && ngControl?.touched);
    },
    get focused() {
      return isFocused();
    },
    get id() {
      return getId();
    },
    ngControl,
    onContainerClick,
    get placeholder() {
      return placeholder?.() ?? '';
    },
    get required() {
      return required?.() ?? false;
    },
    get describedByIds() {
      return describedByIds();
    },
    setDescribedByIds: (ids) => {
      describedByIds.set(ids);
      setAriaDescribedBy?.(ids.join(' '));
    },
    get shouldLabelFloat() {
      return isFocused() || !getIsEmpty();
    },
    stateChanges,
    get value(): TValue {
      return getValue();
    },
    set value(value: TValue) {
      setValue(value);
    },
  };
}

/**
 * Options for the `matFormFieldControl` factory.
 */
export interface MatFormFieldControlOptions<TValue> {
  /**
   * An optional name for the control type that can be used to distinguish
   * `mat-form-field` elements based on their control type. The form field
   * will add a class, `mat-form-field-type-{{controlType}}` to its root
   * element.
   */
  readonly controlType?: string;
  /**
   * Source for the disabled state. This can be a signal, function, or an
   * internal control.
   */
  readonly disabled: (() => boolean) | AbstractControl;
  /**
   * The `MatFormField` will associate its `mat-label` with the `id` returned
   * by this function (or the id of the element).
   *
   * Note that the HTML spec only allows for inputs and selects to
   * be labelable elements.  If your component has an input within, the id
   * should be of that element (not your angular component).
   */
  readonly id: string | (() => string) | ElementRef<HTMLElement>;
  /**
   * Optional placeholder - generally not used as `mat-label` obviates the need
   * for a placeholder.
   */
  readonly placeholder?: () => string | undefined;
  /**
   * Optionally return a value indicating whether the internal state of your
   * component requires a control value to be set.
   */
  readonly required?: () => boolean;
  /**
   * A signal (or internal control) to use for getting and setting the value.
   */
  readonly value: WritableSignal<TValue> | AbstractControl<TValue>;
  /**
   * Optionally provide a signal to determine the empty state.
   *
   * If not provided, will default to a check for the value being "falsey".
   */
  readonly isEmpty?: Signal<boolean>;
  /**
   * Optionally, handles a click on the control's container.
   */
  readonly onContainerClick?: (event: MouseEvent) => void;
  /**
   * Optionally, accepts an aria described by string.
   * This would typically be bound to your input container's
   * `[attr.aria-described-by]`.
   */
  readonly setAriaDescribedBy?: (value: string) => void;
}

function isFunction(value: unknown): value is Function {
  return typeof value === 'function';
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isControl(value: unknown): value is AbstractControl {
  return value instanceof AbstractControl;
}

function arrayEquals<T>(a: readonly T[], b: readonly T[]): boolean {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}
