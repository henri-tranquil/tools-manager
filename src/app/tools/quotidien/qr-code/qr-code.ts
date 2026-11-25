import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import qrcode from 'qrcode-generator';

type Level = 'L' | 'M' | 'Q' | 'H';

const LEVELS: readonly { id: Level; label: string }[] = [
  { id: 'L', label: 'L · 7 %' },
  { id: 'M', label: 'M · 15 %' },
  { id: 'Q', label: 'Q · 25 %' },
  { id: 'H', label: 'H · 30 %' },
];
const MARGIN = 4;

/** La bibliothèque encode chaque caractère sur un octet : on lui passe donc les octets UTF-8. */
function utf8AsBinaryString(text: string): string {
  return Array.from(new TextEncoder().encode(text), (byte) => String.fromCharCode(byte)).join('');
}

interface QrMatrix {
  readonly size: number;
  /** Chemin SVG : un carré de 1 × 1 par module sombre. */
  readonly path: string;
}

function buildQr(text: string, level: Level): QrMatrix | null {
  try {
    const qr = qrcode(0, level);
    qr.addData(utf8AsBinaryString(text), 'Byte');
    qr.make();
    const count = qr.getModuleCount();
    let path = '';
    for (let row = 0; row < count; row += 1) {
      for (let col = 0; col < count; col += 1) {
        if (qr.isDark(row, col)) {
          path += `M${col + MARGIN} ${row + MARGIN}h1v1h-1z`;
        }
      }
    }
    return { size: count + 2 * MARGIN, path };
  } catch {
    return null; // Texte trop long pour un QR code.
  }
}

@Component({
  selector: 'app-qr-code',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .qr {
      display: flex;
      justify-content: center;
    }
    .qr svg {
      width: min(280px, 100%);
      height: auto;
      border: var(--bw) solid var(--ink);
      border-radius: var(--radius);
      box-shadow: var(--shadow);
      background: #fff;
    }
  `,
  template: `
    <div class="tool-layout">
      <div class="tool-layout__inputs">
        <label class="label">
          Lien ou texte
          <textarea
            #t
            class="field field--text"
            rows="4"
            [value]="text()"
            (input)="text.set(t.value)"
          ></textarea>
        </label>
        <div class="label">
          <span id="qr-niveau">Correction d'erreur</span>
          <div class="seg" role="group" aria-labelledby="qr-niveau">
            @for (l of levels; track l.id) {
              <button
                type="button"
                [attr.aria-pressed]="level() === l.id"
                (click)="level.set(l.id)"
              >
                {{ l.label }}
              </button>
            }
          </div>
        </div>
        <p class="note">
          Plus la correction est élevée, plus le code reste lisible s'il est abîmé ou recouvert d'un
          logo. Généré localement.
        </p>
      </div>
      <div class="tool-layout__results">
        <div class="tile tile--wide tile--cream">
          @if (qr(); as q) {
            <div class="qr">
              <svg
                role="img"
                [attr.aria-label]="'QR code : ' + text()"
                [attr.viewBox]="'0 0 ' + q.size + ' ' + q.size"
                shape-rendering="crispEdges"
              >
                <rect [attr.width]="q.size" [attr.height]="q.size" fill="#fff" />
                <path [attr.d]="q.path" fill="#111" />
              </svg>
            </div>
            <div class="row">
              <button type="button" class="btn btn--coral lift" (click)="download('svg')">
                Télécharger SVG
              </button>
              <button type="button" class="btn lift" (click)="download('png')">
                Télécharger PNG
              </button>
            </div>
          } @else if (text().trim()) {
            <p class="tile tile--coral">
              Texte trop long pour un QR code. Raccourcissez-le ou baissez la correction.
            </p>
          } @else {
            <p>Saisissez un lien ou un texte.</p>
          }
        </div>
      </div>
    </div>
  `,
})
export class QrCode {
  protected readonly levels = LEVELS;
  protected readonly text = signal('https://henri-tranquil.github.io/tools-manager/');
  protected readonly level = signal<Level>('M');
  protected readonly qr = computed(() =>
    this.text().trim() ? buildQr(this.text(), this.level()) : null,
  );

  protected download(format: 'svg' | 'png'): void {
    const qr = this.qr();
    if (!qr) {
      return;
    }
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${qr.size} ${qr.size}" width="${qr.size * 10}" height="${qr.size * 10}" shape-rendering="crispEdges"><rect width="${qr.size}" height="${qr.size}" fill="#fff"/><path d="${qr.path}" fill="#111"/></svg>`;
    const svgUrl = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    if (format === 'svg') {
      this.save(svgUrl, 'qr-code.svg');
      return;
    }
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = qr.size * 10;
      canvas.getContext('2d')?.drawImage(image, 0, 0);
      URL.revokeObjectURL(svgUrl);
      canvas.toBlob((blob) => blob && this.save(URL.createObjectURL(blob), 'qr-code.png'));
    };
    image.src = svgUrl;
  }

  private save(url: string, filename: string): void {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
