import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { Alarm, cue, ring, tickLastSeconds } from '../../../shared/beep';
import { Countdown } from '../../../shared/countdown';
import { SoundToggle } from '../../../shared/sound-toggle';
import { COOKING_PRESETS, DEFAULT_PRESET_ID, TimerPreset } from './presets';

@Component({
  selector: 'app-minuteur',
  templateUrl: './minuteur.html',
  styleUrl: './minuteur.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SoundToggle],
})
export class Minuteur {
  protected readonly presets = COOKING_PRESETS;
  protected readonly preset = signal<TimerPreset>(
    COOKING_PRESETS.find((p) => p.id === DEFAULT_PRESET_ID) ?? COOKING_PRESETS[0],
  );
  /** La sonnerie se répète (une minute au plus) jusqu'à ce qu'on l'arrête. */
  protected readonly alarm = new Alarm(() => ring(), 2500, 24);
  protected readonly timer = new Countdown(() => this.alarm.start(), {
    onSecond: (left) => tickLastSeconds(left),
  });

  protected readonly finished = computed(() => this.timer.remaining() === 0);
  protected readonly startLabel = computed(() => {
    if (this.alarm.active()) {
      return 'Arrêter la sonnerie';
    }
    if (this.timer.running()) {
      return 'Pause';
    }
    return this.finished() ? 'Terminé !' : 'Démarrer';
  });

  constructor() {
    this.timer.set(this.preset().seconds);
    inject(DestroyRef).onDestroy(() => {
      this.timer.dispose();
      this.alarm.stop();
    });
  }

  protected toggle(): void {
    if (this.alarm.active()) {
      this.alarm.stop();
      return;
    }
    if (this.finished()) {
      return;
    }
    cue(this.timer.running() ? 'pause' : 'start');
    this.timer.toggle();
  }

  protected choose(preset: TimerPreset): void {
    this.alarm.stop();
    this.preset.set(preset);
    this.timer.set(preset.seconds);
  }

  protected reset(): void {
    this.alarm.stop();
    this.timer.set(this.preset().seconds);
  }
}
