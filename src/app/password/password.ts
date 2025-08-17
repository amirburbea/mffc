import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  NG_VALUE_ACCESSOR,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldControl } from '@angular/material/form-field';
import { MatInput, MatInputModule } from '@angular/material/input';
import { filter, map, pairwise, startWith } from 'rxjs/operators';

import { touchedSignal, valueSignal } from '../../forms/controlSignals';
import { controlValueAccessor } from '../../forms/controlValueAccessor';
import { matFormFieldControl } from '../../forms/matFormFieldControl';

@Component({
  selector: 'app-password',
  templateUrl: './password.html',
  styleUrl: './password.scss',
  imports: [MatCheckboxModule, MatInputModule, ReactiveFormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useFactory() {
        const { form, disabled } = inject(PasswordComponent);
        return controlValueAccessor({
          touched: form, // Any touch in the form will trigger.
          value: form.controls.password,
          setDisabledState: disabled.set, // We disable based on the disabled `model` property.
        });
      },
      multi: true,
    },
    {
      provide: MatFormFieldControl,
      useFactory: () => {
        const {
          disabled,
          form: { controls },
          passwordElement,
          passwordDescribedBy,
          required,
        } = inject(PasswordComponent);
        return matFormFieldControl({
          id: passwordElement(),
          disabled,
          value: controls.password,
          required,
          setAriaDescribedBy: passwordDescribedBy.set,
        });
      },
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PasswordComponent {
  protected readonly disabled = model(false);

  protected readonly form = inject(NonNullableFormBuilder).group({
    password: ['', { updateOn: 'blur' }],
    showPassword: [false],
  });

  protected readonly passwordChange = output<string>();

  protected readonly passwordDescribedBy = signal('');

  protected readonly passwordElement = viewChild.required<MatInput, ElementRef<HTMLInputElement>>(
    MatInput,
    { read: ElementRef }
  );

  protected readonly required = input(false, { transform: booleanAttribute });

  protected readonly touched = touchedSignal(this.form);

  protected readonly type = valueSignal(this.form.controls.showPassword, (value) => {
    return value ? 'text' : 'password';
  });

  constructor() {
    const { form, required, disabled, passwordChange } = this;
    effect(() => {
      if (disabled()) {
        form.disable();
      } else {
        form.enable();
      }
    });
    const { password } = form.controls;
    effect(() => {
      if (required()) {
        password.setValidators(Validators.required);
      } else {
        password.clearValidators();
      }
      password.updateValueAndValidity();
    });
    password.valueChanges
      .pipe(
        startWith(password.value),
        pairwise(),
        filter(([previous, next]) => previous !== next),
        map(([, value]) => value),
        takeUntilDestroyed(inject(DestroyRef))
      )
      .subscribe((value) => void passwordChange.emit(value));
  }

  protected update() {
    const { form, passwordElement } = this;
    form.controls.password.setValue(passwordElement().nativeElement.value);
  }
}
