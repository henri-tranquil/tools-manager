import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { Speech } from './japanese';

/** Choix de la voix japonaise, avec un bouton pour l'essayer. Le choix vaut pour tous les outils. */
@Component({
  selector: 'app-voice-picker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .line {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;

      select {
        flex: 1 1 180px;
        min-width: 0;
        font-size: 15px;
      }
    }
    .warning {
      margin: 0;
      font-weight: 700;
      font-size: 14px;
    }
  `,
  template: `
    @let s = speech();
    @if (s.voices().length) {
      <label class="kicker" for="voix-japonaise">Voix</label>
      <div class="line">
        <select
          id="voix-japonaise"
          class="field"
          (change)="s.chooseVoice($any($event.target).value)"
        >
          @for (v of s.voices(); track v.uri) {
            <option [value]="v.uri" [selected]="v.uri === s.voiceUri()">{{ v.label }}</option>
          }
        </select>
        <button type="button" class="btn btn--small lift" (click)="s.speak(sample)">
          Tester ♪
        </button>
      </div>
      @if (s.robotic()) {
        <p class="warning">
          Cette voix est robotique. Chrome et Edge proposent des voix japonaises naturelles («
          Google 日本語 », « Microsoft Nanami Online ») ; sous Windows ou macOS, une voix japonaise
          peut aussi s'installer dans les réglages du système.
        </p>
      }
    }
  `,
})
export class VoicePicker {
  readonly speech = input.required<Speech>();
  protected readonly sample = 'こんにちは。日本語の れんしゅうを しましょう。';
}
