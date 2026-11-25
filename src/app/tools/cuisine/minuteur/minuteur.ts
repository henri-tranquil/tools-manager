import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { COOKING_PRESETS, DEFAULT_PRESET_ID, formatClock, TimerPreset } from './presets';

@Component({
  selector: 'app-minuteur',
  templateUrl: './minuteur.html',
  styleUrl: './minuteur.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Minuteur {
  protected readonly presets = COOKING_PRESETS;
  protected readonly preset = signal<TimerPreset>(
    COOKING_PRESETS.find((p) => p.id === DEFAULT_PRESET_ID) ?? COOKING_PRESETS[0],
  );
  protected readonly remaining = signal(this.preset().seconds);
  protected readonly running = signal(false);

  protected readonly display = computed(() => formatClock(this.remaining()));
  protected readonly finished = computed(() => this.remaining() === 0);
  protected readonly startLabel = computed(() => {
    if (this.running()) {
      return 'Pause';
    }
    return this.finished() ? 'Terminé !' : 'Démarrer';
  });

  private intervalId: ReturnType<typeof setInterval> | null = null;
  private endsAt = 0;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.stop());
  }

  protected choose(preset: TimerPreset): void {
    this.stop();
    this.preset.set(preset);
    this.remaining.set(preset.seconds);
  }

  protected startPause(): void {
    if (this.running()) {
      this.stop();
      return;
    }
    if (this.finished()) {
      return;
    }
    // On calcule depuis une échéance plutôt que de décrémenter : reste juste même
    // si le navigateur ralentit les onglets en arrière-plan.
    this.endsAt = Date.now() + this.remaining() * 1000;
    this.running.set(true);
    this.intervalId = setInterval(() => this.tick(), 250);
  }

  protected reset(): void {
    this.stop();
    this.remaining.set(this.preset().seconds);
  }

  private tick(): void {
    const left = Math.max(0, Math.ceil((this.endsAt - Date.now()) / 1000));
    this.remaining.set(left);
    if (left === 0) {
      this.stop();
      this.ring();
    }
  }

  private stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.running.set(false);
  }

  /** Trois bips courts, générés localement (aucun fichier son à charger). */
  private ring(): void {
    try {
      const ctx = new AudioContext();
      for (const offset of [0, 0.35, 0.7]) {
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = ctx.currentTime + offset;
        oscillator.frequency.value = 880;
        gain.gain.setValueAtTime(0.2, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.3);
        oscillator.connect(gain).connect(ctx.destination);
        oscillator.start(start);
        oscillator.stop(start + 0.3);
      }
      setTimeout(() => void ctx.close(), 1500);
    } catch {
      // Pas d'audio disponible : l'affichage « Terminé ! » suffit.
    }
  }
}
