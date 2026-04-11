import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE, NativeDateAdapter } from '@angular/material/core';
import type { FrostItem } from '@frostapp/shared';
import { I18nService } from '../../services/i18n.service';
import { QrCodeDialogComponent } from '../qr-code-dialog/qr-code-dialog';

// German date format: DD.MM.YYYY
const GERMAN_DATE_FORMATS = {
  parse: {
    dateInput: 'DD.MM.YYYY',
  },
  display: {
    dateInput: 'DD.MM.YYYY',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};

export interface ItemFormData {
  item?: FrostItem;
  fridgeId?: string;
  shelfId?: string;
}

@Component({
  selector: 'app-item-form',
  standalone: true,
  providers: [
    { provide: DateAdapter, useClass: NativeDateAdapter },
    { provide: MAT_DATE_LOCALE, useValue: 'de-DE' },
    { provide: MAT_DATE_FORMATS, useValue: GERMAN_DATE_FORMATS },
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatCheckboxModule,
    MatIconModule,
  ],
  template: `
    <h2 mat-dialog-title>
      {{ data.item ? i18n.translate('item.edit') : i18n.translate('item.create') }}
    </h2>
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <mat-dialog-content>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>{{ i18n.translate('item.name') }}</mat-label>
          <input
            matInput
            formControlName="name"
            [placeholder]="i18n.translate('item.name.placeholder')"
            required
          />
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>{{ i18n.translate('item.depositDate') }}</mat-label>
          <input
            matInput
            [matDatepicker]="picker"
            formControlName="depositDate"
            required
          />
          <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
          <mat-datepicker #picker></mat-datepicker>
        </mat-form-field>

        @if (data.item) {
          <button
            type="button"
            mat-raised-button
            (click)="showQrCode()"
          >
            <mat-icon>qr_code</mat-icon>
            {{ i18n.translate('item.showQrCode') }}
          </button>
        } @else {
          <mat-checkbox formControlName="generateQrCode" color="primary">
            {{ i18n.translate('item.generateQrCode') }}
          </mat-checkbox>
        }
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button type="button" (click)="onCancel()">
          {{ i18n.translate('item.cancel') }}
        </button>
        <button
          mat-raised-button
          color="primary"
          type="submit"
          [disabled]="form.invalid"
        >
          {{ i18n.translate('item.save') }}
        </button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [`
    .full-width {
      width: 100%;
    }
    mat-dialog-content {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItemFormComponent {
  private readonly dialogRef = inject(MatDialogRef<ItemFormComponent>);
  protected readonly data = inject<ItemFormData>(MAT_DIALOG_DATA);
  protected readonly i18n = inject(I18nService);
  private readonly fb = inject(FormBuilder);

  form: FormGroup = this.fb.group({
    name: [this.data.item?.name ?? '', [Validators.required, Validators.minLength(1)]],
    depositDate: [
      this.data.item ? new Date(this.data.item.depositDate) : new Date(),
      Validators.required,
    ],
    generateQrCode: [false],
    showQrCode: [false],
  });

  onSubmit(): void {
    if (this.form.valid) {
      const value = this.form.value;
      const date = value.depositDate instanceof Date 
        ? value.depositDate.toISOString().split('T')[0]
        : value.depositDate;
      this.dialogRef.close({ 
        ...value, 
        depositDate: date,
        generateQrCode: !this.data.item && value.generateQrCode,
        showQrCode: !!this.data.item && value.showQrCode,
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  showQrCode(): void {
    if (!this.data.item || !this.data.fridgeId || !this.data.shelfId) return;
    
    const dialog = inject(MatDialog);
    dialog.open(QrCodeDialogComponent, {
      width: '400px',
      data: {
        itemId: this.data.item.id,
        itemName: this.form.get('name')?.value ?? this.data.item.name,
        fridgeId: this.data.fridgeId,
        shelfId: this.data.shelfId,
      },
    });
  }
}
