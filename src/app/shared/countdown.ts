import { computed, signal } from '@angular/core';
import { formatClock } from './time';

/**
 * Compte à rebours réutilisable (minuteur, pomodoro, cyanotype…).
 * Il se recalcule depuis une échéance plutôt que de décrémenter : il reste juste même
 * quand le navigateur ralentit les onglets en arrière-plan.
 * Penser à appeler `dispose()` à la destruction du composant.
 */
export class Countdown {
  private readonly remainingSignal = signal(0);
  private readonly runningSignal = signal(false);
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private endsAt = 0;

  readonly remaining = this.remainingSignal.asReadonly();
  readonly running = this.runningSignal.asReadonly();
  readonly display = computed(() => formatClock(this.remainingSignal()));

  constructor(private readonly onFinish: () => void = () => undefined) {}

  /** Arrête le décompte et règle la durée restante. */
  set(seconds: number): void {
    this.stop();
    this.remainingSignal.set(Math.max(0, Math.round(seconds)));
  }

  start(): void {
    if (this.runningSignal() || this.remainingSignal() === 0) {
      return;
    }
    this.endsAt = Date.now() + this.remainingSignal() * 1000;
    this.runningSignal.set(true);
    this.intervalId = setInterval(() => this.tick(), 250);
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
    this.remainingSignal.set(left);
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
    this.runningSignal.set(false);
  }
}
