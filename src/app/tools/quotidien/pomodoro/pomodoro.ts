import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { ring } from '../../../shared/beep';
import { Countdown } from '../../../shared/countdown';
import { readStored, writeStored } from '../../../shared/storage';
import { nextPhase, Phase, PHASE_LABELS } from '../daily-math';

interface Settings {
  work: number;
  short: number;
  long: number;
  longEvery: number;
}

const DEFAULTS: Settings = { work: 25, short: 5, long: 15, longEvery: 4 };
const STORAGE_KEY = 'pomodoro';
const PHASE_COLORS: Readonly<Record<Phase, string>> = {
  travail: 'var(--coral)',
  pause: 'var(--mint)',
  'pause-longue': 'var(--sky)',
};

@Component({
  selector: 'app-pomodoro',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .dots {
      display: flex;
      gap: 8px;
    }
    .dot {
      width: 18px;
      height: 18px;
      border: var(--bw-thin) solid var(--ink);
      border-radius: 50%;
      background: var(--paper);
    }
    .dot--done {
      background: var(--ink);
    }
  `,
  template: `
    <div class="tool-layout">
      <div class="tool-layout__results">
        <div class="tile tile--wide" [style.background]="color()">
          <span class="kicker">{{ label() }} · séance {{ session() }}</span>
          <span class="clock" role="timer" aria-live="off">{{ timer.display() }}</span>
          <div
            class="dots"
            [attr.aria-label]="
              completedInCycle() +
              ' séance(s) sur ' +
              settings().longEvery +
              ' avant la pause longue'
            "
          >
            @for (dot of dots(); track $index) {
              <span class="dot" [class.dot--done]="dot"></span>
            }
          </div>
          <div class="row">
            <button type="button" class="btn btn--dark lift" (click)="timer.toggle()">
              {{ timer.running() ? 'Pause' : 'Démarrer' }}
            </button>
            <button type="button" class="btn lift" (click)="skip()">Passer →</button>
            <button type="button" class="btn btn--ghost" (click)="restart()">Recommencer</button>
          </div>
        </div>
      </div>
      <div class="tool-layout__inputs">
        <p class="kicker">Réglages (minutes)</p>
        <div class="row">
          @for (field of fields; track field.key) {
            <label class="label">
              {{ field.label }}
              <input
                #f
                class="field field--compact"
                type="number"
                min="1"
                max="180"
                [value]="settings()[field.key]"
                (change)="update(field.key, f.value)"
              />
            </label>
          }
        </div>
        <p class="note">
          Les phases s'enchaînent automatiquement avec un bip. Réglages mémorisés dans ce
          navigateur.
        </p>
      </div>
    </div>
  `,
})
export class Pomodoro {
  protected readonly fields: readonly { key: keyof Settings; label: string }[] = [
    { key: 'work', label: 'Travail' },
    { key: 'short', label: 'Pause' },
    { key: 'long', label: 'Pause longue' },
    { key: 'longEvery', label: 'Pause longue toutes les' },
  ];
  protected readonly settings = signal<Settings>({
    ...DEFAULTS,
    ...readStored<Partial<Settings>>(STORAGE_KEY, {}),
  });
  protected readonly phase = signal<Phase>('travail');
  private readonly completedWork = signal(0);

  protected readonly timer = new Countdown(() => this.advance(true));
  protected readonly label = computed(() => PHASE_LABELS[this.phase()]);
  protected readonly color = computed(() => PHASE_COLORS[this.phase()]);
  protected readonly session = computed(
    () => this.completedWork() + (this.phase() === 'travail' ? 1 : 0),
  );
  protected readonly completedInCycle = computed(() => {
    const every = this.settings().longEvery;
    const done = this.completedWork() % every;
    return done === 0 && this.completedWork() > 0 && this.phase() === 'pause-longue' ? every : done;
  });
  protected readonly dots = computed(() =>
    Array.from({ length: this.settings().longEvery }, (_, i) => i < this.completedInCycle()),
  );

  constructor() {
    this.timer.set(this.durationOf('travail'));
    inject(DestroyRef).onDestroy(() => this.timer.dispose());
  }

  protected skip(): void {
    this.advance(false);
  }

  protected restart(): void {
    this.phase.set('travail');
    this.completedWork.set(0);
    this.timer.set(this.durationOf('travail'));
  }

  protected update(key: keyof Settings, raw: string): void {
    const value = Math.round(Number(raw));
    if (!(value >= 1 && value <= 180)) {
      return;
    }
    this.settings.update((s) => ({ ...s, [key]: value }));
    writeStored(STORAGE_KEY, this.settings());
    if (!this.timer.running()) {
      this.timer.set(this.durationOf(this.phase()));
    }
  }

  private advance(autoStart: boolean): void {
    const next = nextPhase(this.phase(), this.completedWork(), this.settings().longEvery);
    this.phase.set(next.phase);
    this.completedWork.set(next.completedWork);
    this.timer.set(this.durationOf(next.phase));
    if (autoStart) {
      ring(next.phase === 'travail' ? 2 : 3);
      this.timer.start();
    }
  }

  private durationOf(phase: Phase): number {
    const s = this.settings();
    const minutes = phase === 'travail' ? s.work : phase === 'pause' ? s.short : s.long;
    return minutes * 60;
  }
}
