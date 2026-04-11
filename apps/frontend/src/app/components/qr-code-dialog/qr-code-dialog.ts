import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { QRCodeComponent } from 'angularx-qrcode';
import { I18nService } from '../../services/i18n.service';

export interface QrCodeDialogData {
  itemId: string;
  itemName: string;
  fridgeId: string;
  shelfId: string;
}

@Component({
  selector: 'app-qr-code-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    QRCodeComponent,
  ],
  template: `
    <h2 mat-dialog-title>{{ i18n.translate('qrCode.title') }}</h2>
    <mat-dialog-content>
      <div class="qr-container">
        <p class="item-name">{{ data.itemName }}</p>
        <div class="qr-wrapper" id="qr-print-area">
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
      <button mat-button (click)="onClose()">
        {{ i18n.translate('common.close') }}
      </button>
      <button mat-raised-button color="primary" (click)="onPrint()">
        <mat-icon>print</mat-icon>
        {{ i18n.translate('qrCode.print') }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
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
    
    @media print {
      ::ng-deep .mat-mdc-dialog-container {
        box-shadow: none !important;
      }
      ::ng-deep .mat-mdc-dialog-surface {
        box-shadow: none !important;
      }
      .qr-container {
        padding: 0;
      }
      .qr-hint,
      .mat-mdc-dialog-actions {
        display: none !important;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QrCodeDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<QrCodeDialogComponent>);
  protected readonly data = inject<QrCodeDialogData>(MAT_DIALOG_DATA);
  protected readonly i18n = inject(I18nService);

  get qrData(): string {
    const baseUrl = window.location.origin;
    return `${baseUrl}/fridge/${this.data.fridgeId}/shelf/${this.data.shelfId}/item/${this.data.itemId}`;
  }

  onClose(): void {
    this.dialogRef.close();
  }

  onPrint(): void {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const qrElement = document.querySelector('#qr-print-area');
    if (!qrElement) return;

    const svgElement = qrElement.querySelector('svg');
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBase64 = btoa(unescape(encodeURIComponent(svgData)));
    const svgUrl = `data:image/svg+xml;base64,${svgBase64}`;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${this.data.itemName} - QR Code</title>
          <style>
            body {
              margin: 0;
              padding: 20px;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              font-family: Arial, sans-serif;
            }
            .print-container {
              text-align: center;
            }
            .item-name {
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 20px;
            }
            .qr-image {
              width: 256px;
              height: 256px;
            }
            .hint {
              margin-top: 16px;
              font-size: 14px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="print-container">
            <div class="item-name">${this.escapeHtml(this.data.itemName)}</div>
            <img class="qr-image" src="${svgUrl}" alt="QR Code" />
            <div class="hint">${this.i18n.translate('qrCode.scanToView')}</div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    
    printWindow.onload = () => {
      printWindow.print();
    };
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
