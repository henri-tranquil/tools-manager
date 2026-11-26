import { ChangeDetectionStrategy, Component } from '@angular/core';
import { setSoundEnabled, soundEnabled } from './beep';

/** Bouton « Son » commun aux outils sonores. Le réglage vaut pour tout le site. */
@Component({
  selector: 'app-sound-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: inline-flex;
    }
    button {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border: var(--bw-thin) solid var(--ink);
      border-radius: 999px;
      background: var(--paper);
      color: var(--ink);
      font-family: var(--font-mono);
      font-size: 13px;
      text-transform: uppercase;
      cursor: pointer;
    }
    button[aria-pressed='true'] {
      background: var(--yellow);
      box-shadow: var(--shadow-sm);
    }
    svg {
      width: 16px;
      height: 16px;
      fill: none;
      stroke: currentColor;
      stroke-width: 2;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
  `,
  template: `
    <button
      type="button"
      [attr.aria-pressed]="on()"
      (click)="setSoundEnabled(!on())"
      [title]="on() ? 'Couper les indications sonores' : 'Activer les indications sonores'"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 9v6h4l5 4V5L8 9z" />
        @if (on()) {
          <path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11" />
        } @else {
          <path d="M17 9l5 6M22 9l-5 6" />
        }
      </svg>
      Son {{ on() ? 'activé' : 'coupé' }}
    </button>
  `,
})
export class SoundToggle {
  protected readonly on = soundEnabled;
  protected readonly setSoundEnabled = setSoundEnabled;
}
