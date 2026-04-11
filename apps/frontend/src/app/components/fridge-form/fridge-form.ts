import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSliderModule } from '@angular/material/slider';
import type { Fridge } from '@frostapp/shared';
import { I18nService } from '../../services/i18n.service';

export interface FridgeFormData {
  fridge?: Fridge;
}

@Component({
  selector: 'app-fridge-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSliderModule,
  ],
  template: `
    <h2 mat-dialog-title>
      {{ data.fridge ? i18n.translate('fridge.edit') : i18n.translate('fridge.create') }}
    </h2>
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <mat-dialog-content>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>{{ i18n.translate('fridge.name') }}</mat-label>
          <input
            matInput
            formControlName="name"
            [placeholder]="i18n.translate('fridge.name.placeholder')"
            required
          />
        </mat-form-field>

        <div class="slider-container">
          <label>{{ i18n.translate('fridge.shelfCount') }}: {{ form.get('shelfCount')?.value }}</label>
          <mat-slider min="1" max="10" step="1" showTickMarks discrete>
            <input matSliderThumb formControlName="shelfCount" />
          </mat-slider>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button type="button" (click)="onCancel()">
          {{ i18n.translate('fridge.cancel') }}
        </button>
        <button
          mat-raised-button
          color="primary"
          type="submit"
          [disabled]="form.invalid"
        >
          {{ i18n.translate('fridge.save') }}
        </button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [`
    .full-width {
      width: 100%;
    }
    .slider-container {
      display: flex;
      flex-direction: column;
      margin-top: 16px;
    }
    .slider-container label {
      margin-bottom: 8px;
    }
    mat-slider {
      width: 100%;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FridgeFormComponent {
  private readonly dialogRef = inject(MatDialogRef<FridgeFormComponent>);
  protected readonly data = inject<FridgeFormData>(MAT_DIALOG_DATA);
  protected readonly i18n = inject(I18nService);
  private readonly fb = inject(FormBuilder);

  form: FormGroup = this.fb.group({
    name: [this.data.fridge?.name ?? '', [Validators.required, Validators.minLength(1)]],
    shelfCount: [this.data.fridge?.shelfCount ?? 4, [Validators.required, Validators.min(1), Validators.max(10)]],
  });

  onSubmit(): void {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
