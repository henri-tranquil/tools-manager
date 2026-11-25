import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';

/** 83456 ms → « 01:23,45 » (ou « 1:01:23,45 » au-delà d'une heure). */
function formatChrono(ms: number): string {
  const total = Math.floor(ms / 10);
  const cs = total % 100;
  const seconds = Math.floor(total / 100) % 60;
  const minutes = Math.floor(total / 6000) % 60;
  const hours = Math.floor(total / 360000);
  const base = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')},${String(cs).padStart(2, '0')}`;
  return hours ? `${hours}:${base}` : base;
}

interface Lap {
  readonly n: number;
  readonly split: number;
  readonly total: number;
}

@Component({
  selector: 'app-chronometre',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="tool-layout">
      <div class="tool-layout__results">
        <div class="tile tile--wide" style="background: #D9F99D">
          <span class="clock" role="timer" aria-live="off">{{ display() }}</span>
          <div class="row">
            <button type="button" class="btn btn--dark lift" (click)="toggle()">
              {{ running() ? 'Arrêter' : elapsed() ? 'Reprendre' : 'Démarrer' }}
            </button>
            <button type="button" class="btn lift" (click)="lap()" [disabled]="!running()">
              Tour
            </button>
            <button
              type="button"
              class="btn btn--ghost"
              (click)="reset()"
              [disabled]="running() || !elapsed()"
            >
              Remettre à zéro
            </button>
          </div>
        </div>
      </div>
      <div class="tool-layout__inputs">
        @if (laps().length) {
          <div class="table-wrap">
            <table class="table">
              <thead>
                <tr>
                  <th scope="col">Tour</th>
                  <th scope="col" class="num">Temps du tour</th>
                  <th scope="col" class="num">Total</th>
                </tr>
              </thead>
              <tbody>
                @for (l of laps(); track l.n) {
                  <tr [style.background]="l.n === best() ? 'var(--mint)' : null">
                    <th scope="row">{{ l.n }}</th>
                    <td class="num">{{ format(l.split) }}</td>
                    <td class="num">{{ format(l.total) }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        } @else {
          <p class="note">
            Appuyez sur « Tour » pendant le chrono pour enregistrer des temps intermédiaires. Le
            meilleur tour est surligné.
          </p>
        }
      </div>
    </div>
  `,
})
export class Chronometre {
  protected readonly format = formatChrono;
  protected readonly running = signal(false);
  protected readonly elapsed = signal(0);
  protected readonly laps = signal<readonly Lap[]>([]);
  protected readonly display = computed(() => formatChrono(this.elapsed()));
  protected readonly best = computed(() => {
    const laps = this.laps();
    return laps.length > 1 ? laps.reduce((a, b) => (b.split < a.split ? b : a)).n : null;
  });

  private startedAt = 0;
  private accumulated = 0;
  private frame = 0;

  constructor() {
    inject(DestroyRef).onDestroy(() => cancelAnimationFrame(this.frame));
  }

  protected toggle(): void {
    if (this.running()) {
      this.accumulated += performance.now() - this.startedAt;
      cancelAnimationFrame(this.frame);
      this.running.set(false);
      this.elapsed.set(this.accumulated);
    } else {
      this.startedAt = performance.now();
      this.running.set(true);
      this.loop();
    }
  }

  protected lap(): void {
    const total = this.accumulated + performance.now() - this.startedAt;
    const previous = this.laps()[0]?.total ?? 0;
    this.laps.update((laps) => [{ n: laps.length + 1, split: total - previous, total }, ...laps]);
  }

  protected reset(): void {
    this.accumulated = 0;
    this.elapsed.set(0);
    this.laps.set([]);
  }

  private loop(): void {
    this.elapsed.set(this.accumulated + performance.now() - this.startedAt);
    this.frame = requestAnimationFrame(() => this.loop());
  }
}
