import { computed, signal } from '@angular/core';
import { unlockAudio } from './beep';
import { formatClock } from './time';

export interface CountdownOptions {
  /** Appelé à chaque seconde écoulée avec le temps restant (tic sonore, avertissement…). */
  readonly onSecond?: (remaining: number) => void;
}

/**
 * Compte à rebours réutilisable (minuteur, pomodoro, cyanotype…).
 * Il se recalcule depuis une échéance plutôt que de décrémenter : il reste juste même
 * quand le navigateur ralentit les onglets en arrière-plan.
 * Une échéance unique (`setTimeout`) double l'intervalle : en arrière-plan, les navigateurs
 * espacent fortement les intervalles répétés, pas un délai isolé, donc la sonnerie reste à l'heure.
 * Penser à appeler `dispose()` à la destruction du composant.
 */
export class Countdown {
  private readonly remainingSignal = signal(0);
  private readonly runningSignal = signal(false);
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private deadlineId: ReturnType<typeof setTimeout> | null = null;
  private endsAt = 0;

  readonly remaining = this.remainingSignal.asReadonly();
  readonly running = this.runningSignal.asReadonly();
  readonly display = computed(() => formatClock(this.remainingSignal()));

  constructor(
    private readonly onFinish: () => void = () => undefined,
    private readonly options: CountdownOptions = {},
  ) {}

  /** Arrête le décompte et règle la durée restante. */
  set(seconds: number): void {
    this.stop();
    this.remainingSignal.set(Math.max(0, Math.round(seconds)));
  }

  start(): void {
    if (this.runningSignal() || this.remainingSignal() === 0) {
      return;
    }
    // Appelé depuis un clic : autorise la sonnerie qui sera jouée plus tard.
    unlockAudio();
    const duration = this.remainingSignal() * 1000;
    this.endsAt = Date.now() + duration;
    this.runningSignal.set(true);
    this.intervalId = setInterval(() => this.tick(), 250);
    this.deadlineId = setTimeout(() => this.tick(), duration + 20);
  }

  pause(): void {
    this.stop();
  }

  toggle(): void {
    if (this.runningSignal()) {
      this.pause();
    } else {
      this.start();
    }
  }

  dispose(): void {
    this.stop();
  }

  private tick(): void {
    const left = Math.max(0, Math.ceil((this.endsAt - Date.now()) / 1000));
    const previous = this.remainingSignal();
    this.remainingSignal.set(left);
    if (left < previous) {
      this.options.onSecond?.(left);
    }
    if (left === 0) {
      this.stop();
      this.onFinish();
    }
  }

  private stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.deadlineId !== null) {
      clearTimeout(this.deadlineId);
      this.deadlineId = null;
    }
    this.runningSignal.set(false);
  }
}
