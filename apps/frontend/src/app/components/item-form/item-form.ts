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
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { QRCodeComponent } from 'angularx-qrcode';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE, NativeDateAdapter } from '@angular/material/core';
import type { FrostItem } from '@frostapp/shared';
import { I18nService } from '../../services/i18n.service';


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
    MatIconModule,
    MatTabsModule,
    QRCodeComponent,
  ],
  template: `
    <h2 mat-dialog-title>
      {{ data.item ? i18n.translate('item.edit') : i18n.translate('item.create') }}
    </h2>
    <mat-tab-group>
      <mat-tab [label]="i18n.translate('item.detailsTab')">
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
      </mat-tab>

      @if (data.item) {
        <mat-tab [label]="i18n.translate('item.qrCodeTab')">
          <mat-dialog-content>
            <div class="qr-container">
              <p class="item-name">{{ data.item.name }}</p>
              <div class="qr-wrapper">
                <qrcode
                  [qrdata]="qrData"
                  [width]="256"
                  [errorCorrectionLevel]="'M'"
                  [margin]="2"
                ></qrcode>
                <p class="qr-label">{{ i18n.translate('qrCode.scanToView') }}</p>
              </div>
              <p class="qr-hint">{{ i18n.translate('qrCode.hint') }}</p>
            </div>
          </mat-dialog-content>
          <mat-dialog-actions align="end">
            <button mat-button type="button" (click)="onCancel()">
              {{ i18n.translate('item.cancel') }}
            </button>
            <button
              mat-raised-button
              color="primary"
              type="button"
              (click)="onSubmit()"
              [disabled]="form.invalid"
            >
              {{ i18n.translate('item.save') }}
            </button>
          </mat-dialog-actions>
        </mat-tab>
      }
    </mat-tab-group>
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
    .qr-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 16px;
    }
    .item-name {
      font-size: 1.25rem;
      font-weight: 500;
      margin-bottom: 16px;
      text-align: center;
    }
    .qr-wrapper {
      background: white;
      padding: 24px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .qr-label {
      margin-top: 12px;
      font-size: 0.875rem;
      color: #666;
      text-align: center;
    }
    .qr-hint {
      margin-top: 16px;
      font-size: 0.75rem;
      color: #999;
      text-align: center;
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
        showQrCode: !!this.data.item && value.showQrCode,
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  get qrData(): string {
    if (!this.data.item || !this.data.fridgeId || !this.data.shelfId) {
      return '';
    }
    const baseUrl = window.location.origin;
    return `${baseUrl}/fridge/${this.data.fridgeId}/shelf/${this.data.shelfId}/item/${this.data.item.id}`;
  }
}
