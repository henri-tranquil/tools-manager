import { DestroyRef, DOCUMENT, inject, signal, Signal } from '@angular/core';

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

export interface Speech {
  /** Une voix japonaise locale est disponible. */
  readonly available: Signal<boolean>;
  speak(text: string): void;
}

/**
 * Prononciation par la synthèse vocale du système. Seules les voix locales (`localService`)
 * sont utilisées : certaines voix « en ligne » des navigateurs enverraient le texte à un serveur.
 */
export function useSpeech(): Speech {
  const available = signal(false);
  const synth = typeof speechSynthesis === 'undefined' ? undefined : speechSynthesis;
  const voice = () =>
    synth
      ?.getVoices()
      .find((v) => v.lang.replace('_', '-').toLowerCase().startsWith('ja') && v.localService);
  const refresh = () => available.set(!!voice());
  refresh();
  synth?.addEventListener('voiceschanged', refresh);
  inject(DestroyRef).onDestroy(() => {
    synth?.removeEventListener('voiceschanged', refresh);
    synth?.cancel();
  });
  return {
    available,
    speak(text: string) {
      const v = voice();
      if (!synth || !v) {
        return;
      }
      synth.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.voice = v;
      utterance.lang = v.lang;
      utterance.rate = 0.8;
      synth.speak(utterance);
    },
  };
}
