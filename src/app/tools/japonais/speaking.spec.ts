import type { Token } from './dictionary';
import {
  bestComparison,
  compareSpeech,
  morae,
  speakingVerdict,
  spellNumbers,
  spokenReading,
} from './speaking';

const token = (surface_form: string, reading: string | undefined, pos = '名詞'): Token => ({
  surface_form,
  reading,
  pos,
  pos_detail_1: '*',
  basic_form: surface_form,
});

describe('expression orale', () => {
  it('découpe en mores', () => {
    expect(morae('きょう')).toEqual(['きょ', 'う']);
    expect(morae('がっこう')).toEqual(['が', 'っ', 'こ', 'う']);
    expect(morae('コーヒー')).toEqual(['こ', 'お', 'ひ', 'い']);
  });

  it('une prononciation identique vaut 100 %', () => {
    const c = compareSpeech('わたしわがくせいです', 'わたしわがくせいです');
    expect(c.score).toBe(1);
    expect(c.parts.every((p) => p.status === 'ok')).toBe(true);
  });

  it('repère un son faux, un son manquant et un son en trop', () => {
    const wrong = compareSpeech('がっこう', 'がっこお');
    // Les voyelles longues sont comparées telles qu'écrites : こう et こお diffèrent.
    expect(wrong.parts.map((p) => p.status)).toEqual(['ok', 'ok', 'ok', 'wrong']);
    expect(wrong.parts[3]).toEqual({ text: 'う', status: 'wrong', heard: 'お' });
    expect(wrong.score).toBeCloseTo(0.75);

    const missing = compareSpeech('がっこう', 'がこう');
    expect(missing.parts.find((p) => p.status === 'missing')?.text).toBe('っ');

    const extra = compareSpeech('ねこ', 'ねこね');
    expect(extra.parts.at(-1)).toEqual({ text: 'ね', status: 'extra' });
  });

  it('garde la meilleure des transcriptions proposées', () => {
    const c = bestComparison('いぬ', ['いる', 'いぬ', 'えぬ']);
    expect(c.score).toBe(1);
    expect(bestComparison('いぬ', []).score).toBe(0);
  });

  it('lit les particules comme on les prononce et écrit les nombres en kana', () => {
    const tokens = [
      token('私', 'ワタシ'),
      token('は', 'ハ', '助詞'),
      token('学校', 'ガッコウ'),
      token('へ', 'ヘ', '助詞'),
      token('行き', 'イキ', '動詞'),
      token('ます', 'マス', '助動詞'),
    ];
    expect(spokenReading(tokens)).toBe('わたしわがっこうえいきます');
    expect(spokenReading([token('ABC', undefined)])).toBe('ABC');
    expect(spellNumbers('3時')).toBe('さん時');
    expect(spellNumbers('８００円')).toBe('はっぴゃく円');
  });

  it('donne un verdict selon le score', () => {
    expect(speakingVerdict(1)).toBe('excellent');
    expect(speakingVerdict(0.8)).toBe('bien');
    expect(speakingVerdict(0.5)).toBe('moyen');
    expect(speakingVerdict(0.1)).toBe('rate');
  });
});
