/**
 * Classement des voix japonaises de la synthèse vocale du navigateur, de la plus naturelle à la
 * plus robotique. Fonctions pures (les voix sont passées en paramètre).
 */

/** Ce qui nous intéresse d'une `SpeechSynthesisVoice`. */
export interface VoiceLike {
  readonly name: string;
  readonly voiceURI: string;
  readonly lang: string;
  readonly localService: boolean;
}

export type VoiceQuality = 'naturelle' | 'correcte' | 'robotique';

export const isJapaneseVoice = (v: VoiceLike) =>
  v.lang.replace('_', '-').toLowerCase().startsWith('ja');

/** Voix de synthèse « à l'ancienne », très peu compréhensibles en japonais. */
const ROBOTIC = /espeak|speech-dispatcher|mbrola|festival|pico/i;
/** Voix neuronales ou de bonne qualité (Google, Microsoft « Natural », Apple…). */
const NATURAL =
  /google|natural|neural|online|premium|enhanced|siri|kyoko|otoya|o-ren|hattori|nanami|keita|aoi|daichi|mayu|naoki|shiori/i;
/** Voix système correctes (Windows : Haruka, Ayumi, Ichiro, Sayaka). */
const DECENT = /haruka|ayumi|ichiro|sayaka|microsoft/i;

export function voiceQuality(voice: VoiceLike): VoiceQuality {
  if (ROBOTIC.test(voice.name) || ROBOTIC.test(voice.voiceURI)) {
    return 'robotique';
  }
  if (NATURAL.test(voice.name)) {
    return 'naturelle';
  }
  return DECENT.test(voice.name) || voice.localService ? 'correcte' : 'naturelle';
}

const RANK: Readonly<Record<VoiceQuality, number>> = { naturelle: 0, correcte: 1, robotique: 2 };

/** Voix japonaises, de la meilleure à la moins bonne ; à qualité égale, les voix locales d'abord. */
export function rankVoices<T extends VoiceLike>(voices: readonly T[]): T[] {
  return voices
    .filter(isJapaneseVoice)
    .map((v, i) => ({ v, i }))
    .sort(
      (a, b) =>
        RANK[voiceQuality(a.v)] - RANK[voiceQuality(b.v)] ||
        Number(b.v.localService) - Number(a.v.localService) ||
        a.i - b.i,
    )
    .map(({ v }) => v);
}

/**
 * Voix principale (celle choisie par l'utilisateur si elle existe encore, sinon la meilleure)
 * et seconde voix pour les dialogues : une autre voix de qualité au moins égale, s'il y en a.
 */
export function pickVoices<T extends VoiceLike>(
  ranked: readonly T[],
  chosenUri: string | null,
): { main: T | undefined; second: T | undefined } {
  const main = ranked.find((v) => v.voiceURI === chosenUri) ?? ranked[0];
  if (!main) {
    return { main: undefined, second: undefined };
  }
  const second = ranked.find(
    (v) => v !== main && RANK[voiceQuality(v)] <= RANK[voiceQuality(main)],
  );
  return { main, second };
}

/** Libellé lisible dans un menu : « Google 日本語 · naturelle · en ligne ». */
export function voiceLabel(voice: VoiceLike): string {
  return `${voice.name} · ${voiceQuality(voice)}${voice.localService ? '' : ' · en ligne'}`;
}
