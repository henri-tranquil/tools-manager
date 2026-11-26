import { PHRASES } from './data/phrases';
import { parsePhrase } from './phrases';
import {
  analyzeFrench,
  checkAssembly,
  checkFrench,
  chunks,
  isNegative,
  keywords,
  overlap,
  tiles,
} from './translation-game';

const phrases = PHRASES.map(parsePhrase);
const find = (text: string) => phrases.find((p) => p.text === text)!;

describe('traduction vers le français', () => {
  it('garde les mots porteurs de sens, sans accents ni pluriel', () => {
    expect(keywords("J'étudie le japonais.")).toEqual(['etudi', 'japonai']);
    expect(keywords('Les chats')).toEqual(['chat']);
  });

  it('accepte une traduction proche et reconnaît une réponse partielle', () => {
    const refs = find('日本語をべんきょうしています。').translations;
    expect(checkFrench("j'etudie le japonais", refs)).toBe('ok');
    expect(checkFrench("J'apprends le japonais !", refs)).toBe('ok');
    expect(checkFrench('le japonais', refs)).toBe('close');
    expect(checkFrench('je mange du pain', refs)).toBe('wrong');
    expect(checkFrench('', refs)).toBe('wrong');
  });

  it('refuse une traduction qui inverse la négation', () => {
    expect(checkFrench("Je n'aime pas le pain.", ["J'aime le pain."])).toBe('wrong');
    expect(analyzeFrench("Je n'aime pas le pain.", ["J'aime le pain."]).negation).toBe('added');
    expect(analyzeFrench("J'aime la viande.", ["Je n'aime pas la viande."]).negation).toBe(
      'missing',
    );
    expect(checkFrench("je n'aime pas la viande", ["Je n'aime pas la viande."])).toBe('ok');
  });

  it("ne prend pas « n'est-ce pas » pour une négation", () => {
    expect(isNegative("C'est bon, n'est-ce pas ?")).toBe(false);
    expect(isNegative("Je n'ai plus faim.")).toBe(true);
    expect(isNegative('Il ne vient jamais.')).toBe(true);
  });

  it('accepte les synonymes et les formes conjuguées', () => {
    expect(checkFrench("C'est délicieux !", ["C'est bon !"])).toBe('ok');
    expect(checkFrench('Je mange du pain.', ['Manger du pain.'])).toBe('ok');
  });

  it('dit quels mots importants manquent', () => {
    const check = analyzeFrench('Le chat', ['Le chat est plus petit que le chien.']);
    expect(check.verdict).toBe('wrong');
    expect(check.found).toEqual(['chat']);
    expect(check.missing).toEqual(['petit', 'chien']);
  });

  it('mesure la part des mots clés retrouvés', () => {
    expect(overlap('le chat est petit', 'Le chat est plus petit que le chien.')).toBeCloseTo(2 / 3);
  });

  it('chaque phrase a une traduction qui se reconnaît elle-même', () => {
    for (const phrase of phrases) {
      for (const t of phrase.translations) {
        expect(checkFrench(t, phrase.translations), t).toBe('ok');
      }
    }
  });
});

describe('assemblage de la phrase japonaise', () => {
  const tokyo = find('あしたとうきょうへ行きます。');

  it('rattache les particules au mot qui les précède', () => {
    expect(chunks(find('わたしは学生です。'))).toEqual(['わたしは', '学生', 'です']);
    expect(chunks(tokyo)).toEqual(['あした', 'とうきょうへ', '行きます']);
  });

  it('accepte l’ordre modèle, signale un autre ordre possible, refuse le reste', () => {
    expect(checkAssembly(['あした', 'とうきょうへ', '行きます'], tokyo)).toBe('exact');
    expect(checkAssembly(['とうきょうへ', 'あした', '行きます'], tokyo)).toBe('order');
    expect(checkAssembly(['行きます', 'あした', 'とうきょうへ'], tokyo)).toBe('wrong');
    expect(checkAssembly(['あした', '行きます'], tokyo)).toBe('wrong');
  });

  it('mélange les étiquettes de la phrase avec des intrus', () => {
    let n = 0;
    const list = tiles(tokyo, phrases, 2, (max) => n++ % max);
    expect(list).toHaveLength(5);
    for (const chunk of chunks(tokyo)) {
      expect(list).toContain(chunk);
    }
  });
});
