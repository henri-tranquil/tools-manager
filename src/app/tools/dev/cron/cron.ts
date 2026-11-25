import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { describeCron, nextRuns, parseCron } from './cron-parser';

const EXAMPLES = ['*/15 * * * *', '0 8 * * 1-5', '30 6 1 * *', '0 0 * * 0', '@hourly'];
const DATE_FORMAT = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

@Component({
  selector: 'app-cron',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .cron-input {
      font-family: var(--font-mono);
      font-weight: 700;
    }
    .legend {
      display: grid;
      grid-template-columns: repeat(5, minmax(0, 1fr));
      gap: 6px;
    }
    .legend span {
      font-family: var(--font-mono);
      font-size: 11px;
      text-align: center;
    }
    .examples {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .examples button {
      cursor: pointer;
    }
    .runs {
      margin: 0;
      padding-left: 20px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      font-weight: 500;
    }
  `,
  template: `
    <div class="tool-layout">
      <div class="tool-layout__inputs">
        <label class="label">
          Expression cron
          <input
            #e
            class="field field--compact cron-input"
            type="text"
            spellcheck="false"
            autocomplete="off"
            [value]="expression()"
            (input)="expression.set(e.value)"
          />
        </label>
        <div class="legend" aria-hidden="true">
          <span>minute</span><span>heure</span><span>jour</span><span>mois</span
          ><span>jour sem.</span>
        </div>
        <div class="examples">
          @for (example of examples; track example) {
            <button type="button" class="tag" (click)="expression.set(example)">
              {{ example }}
            </button>
          }
        </div>
      </div>

      <div class="tool-layout__results" aria-live="polite">
        @if (result(); as r) {
          @if (r.ok) {
            <div class="tile tile--wide tile--yellow">
              <span class="kicker">En clair</span>
              <span class="tile__value">{{ r.description }}</span>
            </div>
            <div class="tile tile--wide">
              <span class="kicker">Prochaines exécutions (heure locale)</span>
              @if (r.runs.length) {
                <ol class="runs">
                  @for (run of r.runs; track $index) {
                    <li>{{ run }}</li>
                  }
                </ol>
              } @else {
                <p>Aucune exécution dans les 5 prochaines années (date impossible ?).</p>
              }
            </div>
          } @else {
            <p class="tile tile--wide tile--coral" role="alert">{{ r.error }}</p>
          }
        }
      </div>
    </div>
  `,
})
export class Cron {
  protected readonly examples = EXAMPLES;
  protected readonly expression = signal('0 8 * * 1-5');

  protected readonly result = computed(() => {
    const parsed = parseCron(this.expression());
    if (!parsed.ok) {
      return { ok: false as const, error: parsed.error };
    }
    return {
      ok: true as const,
      description: describeCron(parsed.cron),
      runs: nextRuns(parsed.cron, new Date()).map((d) => DATE_FORMAT.format(d)),
    };
  });
}
