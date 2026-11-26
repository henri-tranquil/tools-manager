import { pickVoices, rankVoices, voiceLabel, voiceQuality, VoiceLike } from './voices';

const voice = (name: string, localService: boolean, lang = 'ja-JP'): VoiceLike => ({
  name,
  voiceURI: name,
  lang,
  localService,
});

const espeak = voice('Japanese (espeak-ng)', true, 'ja');
const google = voice('Google 日本語', false);
const haruka = voice('Microsoft Haruka - Japanese (Japan)', true);
const nanami = voice('Microsoft Nanami Online (Natural) - Japanese (Japan)', false);
const kyoko = voice('Kyoko', true);
const french = voice('Google français', false, 'fr-FR');

describe('choix des voix japonaises', () => {
  it('reconnaît les voix robotiques et naturelles', () => {
    expect(voiceQuality(espeak)).toBe('robotique');
    expect(voiceQuality(google)).toBe('naturelle');
    expect(voiceQuality(nanami)).toBe('naturelle');
    expect(voiceQuality(kyoko)).toBe('naturelle');
    expect(voiceQuality(haruka)).toBe('correcte');
  });

  it('préfère une voix en ligne de qualité à eSpeak, même installé localement (cas de Linux)', () => {
    expect(rankVoices([espeak, french, google])).toEqual([google, espeak]);
  });

  it('à qualité égale, garde les voix locales en premier', () => {
    expect(rankVoices([nanami, kyoko, haruka, espeak])).toEqual([kyoko, nanami, haruka, espeak]);
  });

  it('respecte le choix de l’utilisateur et trouve une seconde voix aussi bonne', () => {
    const ranked = rankVoices([espeak, google, nanami]);
    expect(pickVoices(ranked, null)).toEqual({ main: google, second: nanami });
    expect(pickVoices(ranked, nanami.voiceURI).main).toBe(nanami);
    expect(pickVoices(ranked, 'disparue').main).toBe(google);
    // Seule une voix naturelle et eSpeak : pas de seconde voix robotique pour les dialogues.
    expect(pickVoices(rankVoices([espeak, google]), null).second).toBeUndefined();
    expect(pickVoices([], null).main).toBeUndefined();
  });

  it('affiche un libellé clair', () => {
    expect(voiceLabel(google)).toBe('Google 日本語 · naturelle · en ligne');
  });
});
