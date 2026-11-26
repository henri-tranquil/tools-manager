import { signal } from '@angular/core';
import { readStored, writeStored } from './storage';

/**
 * Indications sonores générées localement avec Web Audio (aucun fichier son à charger).
 * Sans effet si l'audio est indisponible ou si l'utilisateur a coupé le son.
 *
 * Un seul `AudioContext` est partagé : les navigateurs mobiles n'autorisent le son qu'après un
 * geste de l'utilisateur. `unlockAudio()` est appelé au clic sur « Démarrer » pour qu'une sonnerie
 * déclenchée plus tard (fin du minuteur, onglet en arrière-plan) soit bien jouée.
 */

const STORAGE_KEY = 'son';
const enabled = signal(readStored<boolean>(STORAGE_KEY, true));

/** Préférence globale « son activé », mémorisée sous `etabli:son`. */
export const soundEnabled = enabled.asReadonly();

export function setSoundEnabled(value: boolean): void {
  enabled.set(value);
  writeStored(STORAGE_KEY, value);
  if (value) {
    unlockAudio();
    cue('toggle');
  }
}

let context: AudioContext | null = null;

function audio(): AudioContext | null {
  try {
    context ??= new AudioContext();
    if (context.state === 'suspended') {
      void context.resume();
    }
    return context;
  } catch {
    return null;
  }
}

/** À appeler dans un gestionnaire de clic : autorise les sons joués plus tard. */
export function unlockAudio(): void {
  audio();
}

interface Note {
  /** Fréquence en Hz. */
  readonly f: number;
  /** Début, en secondes après l'appel. */
  readonly at: number;
  /** Durée en secondes. */
  readonly len: number;
  readonly type?: OscillatorType;
  readonly volume?: number;
}

function play(notes: readonly Note[]): void {
  if (!enabled()) {
    return;
  }
  const ctx = audio();
  if (!ctx) {
    return;
  }
  try {
    const now = ctx.currentTime + 0.01;
    for (const note of notes) {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = now + note.at;
      oscillator.type = note.type ?? 'sine';
      oscillator.frequency.value = note.f;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(note.volume ?? 0.2, start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + note.len);
      oscillator.connect(gain).connect(ctx.destination);
      oscillator.start(start);
      oscillator.stop(start + note.len + 0.02);
    }
  } catch {
    // Pas d'audio disponible : l'affichage suffit.
  }
}

/** Série de bips identiques (sonnerie de fin). */
export function ring(times = 3, frequency = 880): void {
  play(Array.from({ length: times }, (_, i) => ({ f: frequency, at: i * 0.35, len: 0.3 })));
}

export type Cue =
  'start' | 'pause' | 'lap' | 'tick' | 'warning' | 'work' | 'break' | 'level' | 'roll' | 'toggle';

const CUES: Readonly<Record<Cue, readonly Note[]>> = {
  // Deux notes montantes : c'est parti.
  start: [
    { f: 660, at: 0, len: 0.09 },
    { f: 990, at: 0.09, len: 0.12 },
  ],
  // Deux notes descendantes : en pause.
  pause: [
    { f: 990, at: 0, len: 0.09 },
    { f: 660, at: 0.09, len: 0.12 },
  ],
  lap: [{ f: 1320, at: 0, len: 0.07, type: 'triangle' }],
  // Tic des dernières secondes.
  tick: [{ f: 1000, at: 0, len: 0.05, type: 'square', volume: 0.06 }],
  // Avertissement : deux bips graves rapprochés.
  warning: [
    { f: 520, at: 0, len: 0.14, type: 'triangle' },
    { f: 520, at: 0.2, len: 0.14, type: 'triangle' },
  ],
  // Reprise du travail : arpège montant.
  work: [
    { f: 523, at: 0, len: 0.15 },
    { f: 659, at: 0.15, len: 0.15 },
    { f: 784, at: 0.3, len: 0.3 },
  ],
  // Pause : arpège descendant, plus doux.
  break: [
    { f: 784, at: 0, len: 0.18, volume: 0.15 },
    { f: 659, at: 0.2, len: 0.18, volume: 0.15 },
    { f: 523, at: 0.4, len: 0.4, volume: 0.15 },
  ],
  level: [{ f: 1568, at: 0, len: 0.12, volume: 0.12 }],
  roll: [
    { f: 300, at: 0, len: 0.04, type: 'square', volume: 0.05 },
    { f: 360, at: 0.05, len: 0.04, type: 'square', volume: 0.05 },
    { f: 420, at: 0.1, len: 0.04, type: 'square', volume: 0.05 },
    { f: 880, at: 0.17, len: 0.15, type: 'triangle', volume: 0.15 },
  ],
  toggle: [{ f: 880, at: 0, len: 0.08 }],
};

/** Joue une indication sonore courte. */
export function cue(name: Cue): void {
  play(CUES[name]);
}

/** Tic sur les `last` dernières secondes d'un compte à rebours (à brancher sur `onSecond`). */
export function tickLastSeconds(remaining: number, last = 3): void {
  if (remaining > 0 && remaining <= last) {
    cue('tick');
  }
}

export type AnswerResult = 'ok' | 'close' | 'ko';

const SEMITONE = 2 ** (1 / 12);

/**
 * Retour sonore d'une réponse de quiz, volontairement discret pour ne pas lasser :
 * sinus doux à faible volume, moins de 0,3 s, jamais de buzzer.
 * - juste : petit carillon de deux notes, qui monte d'un demi-ton par bonne réponse
 *   d'affilée (6 au plus) pour que la série s'entende sans répéter le même son ;
 *   tous les 5 d'affilée, un court arpège en plus ;
 * - presque : une seule note médium ;
 * - faux : deux notes graves qui descendent, feutrées.
 */
export function answerSound(result: AnswerResult, streak = 0): void {
  if (result === 'ko') {
    play([
      { f: 330, at: 0, len: 0.13, type: 'triangle', volume: 0.07 },
      { f: 262, at: 0.11, len: 0.2, type: 'triangle', volume: 0.06 },
    ]);
    return;
  }
  if (result === 'close') {
    play([{ f: 784, at: 0, len: 0.18, volume: 0.07 }]);
    return;
  }
  const base = 880 * SEMITONE ** Math.min(6, Math.max(0, streak - 1));
  const notes: Note[] = [
    { f: base, at: 0, len: 0.1, volume: 0.08 },
    { f: base * SEMITONE ** 4, at: 0.08, len: 0.22, volume: 0.08 },
  ];
  if (streak > 0 && streak % 5 === 0) {
    notes.push(
      { f: base * 2, at: 0.24, len: 0.08, volume: 0.05 },
      { f: base * 2 * SEMITONE ** 4, at: 0.31, len: 0.08, volume: 0.05 },
      { f: base * 2 * SEMITONE ** 7, at: 0.38, len: 0.2, volume: 0.05 },
    );
  }
  play(notes);
}

/** Fin d'une série ou d'un examen : petit arpège, plus marqué si le résultat est bon. */
export function finishSound(success: boolean): void {
  const steps = success ? [0, 4, 7, 12] : [0, 3, 7];
  play(
    steps.map((st, i) => ({
      f: 523 * SEMITONE ** st,
      at: i * 0.11,
      len: i === steps.length - 1 ? 0.35 : 0.12,
      volume: 0.08,
    })),
  );
}

/**
 * Sonnerie répétée jusqu'à ce qu'on l'arrête (comme un vrai minuteur de cuisine),
 * limitée à `repeat` fois. `stop()` est sans effet si elle est déjà finie.
 */
export class Alarm {
  private timer: ReturnType<typeof setInterval> | null = null;
  private readonly activeSignal = signal(false);
  readonly active = this.activeSignal.asReadonly();

  constructor(
    private readonly sound: () => void,
    private readonly every = 2500,
    private readonly repeat = 12,
  ) {}

  start(): void {
    this.stop();
    let count = 1;
    this.sound();
    this.activeSignal.set(true);
    this.timer = setInterval(() => {
      if (count >= this.repeat) {
        this.stop();
        return;
      }
      count += 1;
      this.sound();
    }, this.every);
  }

  stop(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.activeSignal.set(false);
  }
}
