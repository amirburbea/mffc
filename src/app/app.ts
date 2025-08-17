import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

import { touchedSignal, valueSignal } from '../forms/controlSignals';
import { PasswordComponent } from './password/password';

@Component({
  selector: 'app-root',
  imports: [
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatTooltipModule,
    PasswordComponent,
    ReactiveFormsModule,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly document = inject(DOCUMENT);
  private readonly formBuilder = inject(NonNullableFormBuilder);

  protected readonly form = this.formBuilder.group({
    password: ['', Validators.required],
  });

  protected readonly disablePassword = signal(false);

  protected readonly isDark = signal([...this.document.body.classList].includes('dark-theme'));

  protected readonly password = valueSignal(this.form.controls.password);

  protected readonly passwordTouched = touchedSignal(this.form.controls.password);

  constructor() {
    const { document, isDark, form, disablePassword } = this;
    effect(() => {
      document.body.classList.toggle('dark-theme', isDark());
    });
    effect(() => {
      const { password } = form.controls;
      if (disablePassword()) {
        password.disable();
      } else {
        password.enable();
      }
    });
  }

  protected toggleDarkMode() {
    this.isDark.update((value) => !value);
  }

  protected toggleDisablePassword() {
    this.disablePassword.update((value) => !value);
  }
}
