import { PHRASES } from './data/phrases';
import { parsePhrase } from './phrases';
import { checkAssembly, checkFrench, chunks, keywords, overlap, tiles } from './translation-game';

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
