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
import { COOKING_PRESETS, DEFAULT_PRESET_ID, TimerPreset } from './presets';

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
  protected readonly timer = new Countdown(() => ring());

  protected readonly finished = computed(() => this.timer.remaining() === 0);
  protected readonly startLabel = computed(() => {
    if (this.timer.running()) {
      return 'Pause';
    }
    return this.finished() ? 'Terminé !' : 'Démarrer';
  });

  constructor() {
    this.timer.set(this.preset().seconds);
    inject(DestroyRef).onDestroy(() => this.timer.dispose());
  }

  protected choose(preset: TimerPreset): void {
    this.preset.set(preset);
    this.timer.set(preset.seconds);
  }

  protected reset(): void {
    this.timer.set(this.preset().seconds);
  }
}
