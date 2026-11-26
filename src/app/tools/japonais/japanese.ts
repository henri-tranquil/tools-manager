import { DestroyRef, DOCUMENT, inject, signal, Signal } from '@angular/core';
import { readStored, writeStored } from '../../shared/storage';
import { pickVoices, rankVoices, voiceLabel, voiceQuality } from './voices';

/**
 * Outils communs aux panneaux de japonais (navigateur uniquement : les panneaux d'outils ne sont
 * jamais rendus au prérendu).
 */

const FONT_LINK_ID = 'etabli-jp-font';

/**
 * Charge la police japonaise (Klee One, auto-hébergée) à l'ouverture d'un outil de
 * japonais seulement : sa feuille de style est un bundle non injecté (`jp-font.css`, voir
 * angular.json), et le navigateur ne télécharge que les tranches de caractères affichés.
 */
export function loadJapaneseFont(): void {
  const doc = inject(DOCUMENT);
  if (doc.getElementById(FONT_LINK_ID)) {
    return;
  }
  const link = doc.createElement('link');
  link.id = FONT_LINK_ID;
  link.rel = 'stylesheet';
  link.href = 'jp-font.css';
  doc.head.append(link);
}

export interface SpeakOptions {
  /** Vitesse (1 = normale). */
  readonly rate?: number;
  /** Locuteur : 0 (voix principale) ou 1 (seconde voix, ou la même plus aiguë). */
  readonly speaker?: 0 | 1;
}

export interface Line {
  readonly text: string;
  readonly speaker?: 0 | 1;
}

export interface VoiceOption {
  readonly uri: string;
  readonly label: string;
}

export interface Speech {
  /** Une voix japonaise est disponible. */
  readonly available: Signal<boolean>;
  /** La voix choisie est une voix « en ligne » : le texte part vers le service du navigateur. */
  readonly online: Signal<boolean>;
  /** La meilleure voix disponible est robotique (eSpeak…) : les outils le signalent. */
  readonly robotic: Signal<boolean>;
  readonly speaking: Signal<boolean>;
  /** Voix japonaises, de la plus naturelle à la plus robotique. */
  readonly voices: Signal<readonly VoiceOption[]>;
  /** Voix utilisée (choisie ou, à défaut, la meilleure). */
  readonly voiceUri: Signal<string | null>;
  /** Choisit la voix ; le choix vaut pour tous les outils de japonais. */
  chooseVoice(uri: string): void;
  /** Prononce un texte ; la promesse se résout à la fin (ou à l'annulation). */
  speak(text: string, options?: SpeakOptions): Promise<void>;
  /** Enchaîne des répliques avec une courte pause entre elles. */
  speakLines(lines: readonly Line[], rate?: number, pauseMs?: number): Promise<void>;
  cancel(): void;
}

const VOICE_KEY = 'japonais:voix';

/**
 * Prononciation par la synthèse vocale du navigateur. Les voix sont classées par qualité
 * (`voices.ts`) : une voix naturelle, même « en ligne », passe avant une voix robotique
 * installée sur l'appareil (eSpeak sous Linux). Une voix en ligne envoie le texte lu au service
 * de synthèse du navigateur, ce que les outils signalent à l'écran. L'utilisateur peut choisir
 * sa voix ; le choix est mémorisé.
 */
export function useSpeech(): Speech {
  const available = signal(false);
  const online = signal(false);
  const robotic = signal(false);
  const speaking = signal(false);
  const voices = signal<readonly VoiceOption[]>([]);
  const voiceUri = signal<string | null>(null);
  const synth = typeof speechSynthesis === 'undefined' ? undefined : speechSynthesis;
  let chosen = readStored<string | null>(VOICE_KEY, null);
  let generation = 0;

  const ranked = () => rankVoices(synth?.getVoices() ?? []);
  const current = () => pickVoices(ranked(), chosen);
  const refresh = () => {
    const list = ranked();
    const { main } = pickVoices(list, chosen);
    available.set(list.length > 0);
    online.set(!!main && !main.localService);
    robotic.set(!!main && voiceQuality(main) === 'robotique');
    voices.set(list.map((v) => ({ uri: v.voiceURI, label: voiceLabel(v) })));
    voiceUri.set(main?.voiceURI ?? null);
  };
  refresh();
  synth?.addEventListener('voiceschanged', refresh);
  inject(DestroyRef).onDestroy(() => {
    synth?.removeEventListener('voiceschanged', refresh);
    generation++;
    synth?.cancel();
  });

  const utter = (text: string, options: SpeakOptions, token: number): Promise<void> =>
    new Promise((resolve) => {
      const { main, second } = current();
      if (!synth || !main || token !== generation) {
        resolve();
        return;
      }
      const speaker = options.speaker ?? 0;
      // Seconde voix aussi bonne si le système en a une, sinon la même voix, plus aiguë.
      const voice = speaker === 1 && second ? second : main;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.voice = voice;
      utterance.lang = voice.lang;
      utterance.rate = 0.9 * (options.rate ?? 1);
      utterance.pitch = speaker === 1 && !second ? 1.35 : 1;
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();
      synth.speak(utterance);
    });

  const run = async (task: (token: number) => Promise<void>) => {
    synth?.cancel();
    const token = ++generation;
    speaking.set(true);
    try {
      await task(token);
    } finally {
      if (token === generation) {
        speaking.set(false);
      }
    }
  };

  return {
    available,
    online,
    robotic,
    speaking,
    voices,
    voiceUri,
    chooseVoice(uri) {
      chosen = uri;
      writeStored(VOICE_KEY, uri);
      refresh();
    },
    speak(text, options = {}) {
      return run((token) => utter(text, options, token));
    },
    speakLines(lines, rate = 1, pauseMs = 450) {
      return run(async (token) => {
        for (const line of lines) {
          if (token !== generation) {
            return;
          }
          await utter(line.text, { rate, speaker: line.speaker }, token);
          await new Promise((r) => setTimeout(r, pauseMs));
        }
      });
    },
    cancel() {
      generation++;
      synth?.cancel();
      speaking.set(false);
    },
  };
}
