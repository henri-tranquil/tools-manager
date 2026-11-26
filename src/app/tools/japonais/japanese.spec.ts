import { PHRASES } from './data/phrases';
import { KANJI } from './data/kanji';
import { eraseAt } from './draw-pad';
import { analyze, furigana, Glossary, glossFor, sentenceRomaji, Token } from './dictionary';
import { isKanji } from './kana';
import { checkTranscription, parsePhrase } from './phrases';
import {
  accuracy,
  choices,
  EMPTY_SCORE,
  nextScore,
  pickWeighted,
  recordAnswer,
  remember,
  toReview,
  weightOf,
} from './quiz';

const sequence = (...values: number[]) => {
  let i = 0;
  return () => values[i++ % values.length];
};

describe('furigana', () => {
  it('ne place la lecture qu’au-dessus des kanji', () => {
    expect(furigana('食べる', 'タベル')).toEqual([{ text: '食', ruby: 'た' }, { text: 'べる' }]);
    expect(furigana('お茶', 'おちゃ')).toEqual([{ text: 'お' }, { text: '茶', ruby: 'ちゃ' }]);
    expect(furigana('晩ご飯', 'ばんごはん')).toEqual([
      { text: '晩', ruby: 'ばん' },
      { text: 'ご' },
      { text: '飯', ruby: 'はん' },
    ]);
  });

  it('laisse les mots en kana sans lecture et se rabat sur le mot entier', () => {
    expect(furigana('ねこ', 'ネコ')).toEqual([{ text: 'ねこ' }]);
    expect(furigana('今日', 'きょう')).toEqual([{ text: '今日', ruby: 'きょう' }]);
  });
});

describe('analyse d’une phrase', () => {
  const glossary = new Glossary([
    ['私', 'わたし|わたくし', 'je, moi', 0],
    ['勉強', 'べんきょう', 'étude', 0],
    ['為る', 'する', 'faire', 0],
    ['日本語', 'にほんご', 'langue japonaise', 0],
    ['', 'ペン', 'pen', 1],
    ['九', 'く|きゅう|この', 'neuf (9)', 0],
    ['此の', 'この', 'ce', 0],
  ]);
  const tokens: Token[] = [
    {
      surface_form: '私',
      pos: '名詞',
      pos_detail_1: '代名詞',
      basic_form: '私',
      reading: 'ワタシ',
    },
    { surface_form: 'は', pos: '助詞', pos_detail_1: '係助詞', basic_form: 'は', reading: 'ハ' },
    {
      surface_form: '日本語',
      pos: '名詞',
      pos_detail_1: '一般',
      basic_form: '日本語',
      reading: 'ニホンゴ',
    },
    { surface_form: 'を', pos: '助詞', pos_detail_1: '格助詞', basic_form: 'を', reading: 'ヲ' },
    {
      surface_form: '勉強',
      pos: '名詞',
      pos_detail_1: 'サ変接続',
      basic_form: '勉強',
      reading: 'ベンキョウ',
    },
    { surface_form: 'し', pos: '動詞', pos_detail_1: '自立', basic_form: 'する', reading: 'シ' },
    { surface_form: 'て', pos: '助詞', pos_detail_1: '接続助詞', basic_form: 'て', reading: 'テ' },
    { surface_form: 'い', pos: '動詞', pos_detail_1: '非自立', basic_form: 'いる', reading: 'イ' },
    { surface_form: 'ます', pos: '助動詞', pos_detail_1: '*', basic_form: 'ます', reading: 'マス' },
    { surface_form: '。', pos: '記号', pos_detail_1: '句点', basic_form: '。', reading: '。' },
  ];

  it('donne lecture, nature, forme du dictionnaire et sens de chaque mot', () => {
    const words = analyze(tokens, glossary);
    expect(words[0]).toMatchObject({
      romaji: 'watashi',
      pos: 'pronom',
      gloss: { text: 'je, moi', source: 'fr' },
    });
    expect(words[1]).toMatchObject({
      romaji: 'wa',
      pos: 'particule',
      gloss: { source: 'grammaire' },
    });
    expect(words[3].romaji).toBe('o');
    expect(words[5]).toMatchObject({ lemma: 'する', gloss: { text: 'faire' } });
    expect(words[7].gloss?.text).toContain('en train de');
    expect(words[9].gloss).toBeUndefined();
    expect(sentenceRomaji(words)).toBe('watashi wa nihongo o benkyou shi te i masu.');
  });

  it('préfère l’entrée dont la lecture correspond et signale l’anglais', () => {
    expect(glossary.lookup('わたくし')?.text).toBe('je, moi');
    expect(glossary.lookup('ペン')).toEqual({ text: 'pen', source: 'en' });
    expect(glossary.lookup('inconnu')).toBeUndefined();
    expect(glossary.lookup('この', 'コノ')?.text).toBe('ce');
    expect(
      glossFor(
        { surface_form: 'ペン', pos: '名詞', pos_detail_1: '一般', basic_form: 'ペン' },
        glossary,
      )?.source,
    ).toBe('en');
  });
});

describe('jeu de lecture', () => {
  const phrases = PHRASES.map(parsePhrase);
  const gakusei = phrases.find((p) => p.text === 'わたしは学生です。')!;

  it('lit la syntaxe du corpus (furigana, okurigana, particules)', () => {
    expect(gakusei.romaji).toBe('watashi wa gakusei desu.');
    expect(gakusei.kana).toBe('わたしはがくせいです。');
    const nomu = phrases.find((p) => p.text === '水を飲みます。')!;
    expect(nomu.words[2].ruby).toEqual([{ text: '飲', ruby: 'の' }, { text: 'みます' }]);
    expect(nomu.romaji).toBe('mizu o nomimasu.');
  });

  it('accepte toutes les orthographes, signale voyelles longues et particules', () => {
    expect(checkTranscription('watashi wa gakusei desu', gakusei)).toBe('exact');
    expect(checkTranscription('WATASI WA GAKUSEI DESU.', gakusei)).toBe('exact');
    expect(checkTranscription('watashi ha gakusei desu', gakusei)).toBe('particle');
    expect(checkTranscription('watashi wa gakuse desu', gakusei)).toBe('long-vowels');
    expect(checkTranscription('watashi wa sensei desu', gakusei)).toBe('wrong');
    expect(checkTranscription('', gakusei)).toBe('wrong');
  });

  it('a un corpus varié de phrases toutes différentes', () => {
    expect(phrases.length).toBeGreaterThanOrEqual(150);
    expect(new Set(phrases.map((p) => p.text)).size).toBe(phrases.length);
    for (const level of [1, 2, 3]) {
      expect(phrases.filter((p) => p.level === level).length).toBeGreaterThan(40);
    }
  });

  it('n’utilise que des kanji du N5 : les autres mots passent en hiragana', () => {
    const n5 = new Set(KANJI.map((k) => k.k));
    for (const phrase of phrases) {
      for (const c of phrase.text) {
        if (isKanji(c)) {
          expect(n5.has(c), `${phrase.text} : ${c}`).toBe(true);
        }
      }
    }
    expect(phrases.find((p) => p.text === '日本語をべんきょうしています。')!.romaji).toBe(
      'nihongo o benkyou shite imasu.',
    );
  });

  it('place les furigana sur les seuls kanji et garde l’écriture d’origine en mode kana', () => {
    for (const phrase of phrases) {
      for (const word of phrase.words) {
        for (const seg of word.ruby) {
          if (seg.ruby) {
            expect([...seg.text].every(isKanji), `${phrase.text} : ${seg.text}`).toBe(true);
          }
        }
      }
    }
    expect(phrases.find((p) => p.text === 'こんにちは。')!.kana).toBe('こんにちは。');
    expect(phrases.find((p) => p.text === 'こんにちは。')!.romaji).toBe('konnichiwa.');
  });

  it('toutes les phrases du corpus sont lisibles et traduites', () => {
    for (const phrase of phrases) {
      expect(phrase.text, phrase.text).not.toMatch(/[[\]_ ]/);
      expect(phrase.romaji, phrase.text).toMatch(/^[a-z' ,.?!-]+$/);
      expect(checkTranscription(phrase.romaji, phrase), phrase.text).toBe('exact');
      expect(phrase.fr).toBeTruthy();
    }
  });
});

describe('données kanji', () => {
  it('contient les kanji du N5 avec lectures et sens', () => {
    expect(KANJI).toHaveLength(103);
    expect(KANJI.every((k) => k.level === 'N5')).toBe(true);
    for (const kanji of KANJI) {
      expect(kanji.on.length + kanji.kun.length, kanji.k).toBeGreaterThan(0);
      expect(kanji.meanings.length, kanji.k).toBeGreaterThan(0);
    }
  });
});

describe('mécanique des quiz', () => {
  it('fait revenir plus souvent ce qu’on rate', () => {
    expect(weightOf(undefined)).toBe(3);
    expect(weightOf({ ok: 10, ko: 0 })).toBe(1);
    expect(weightOf({ ok: 0, ko: 5 })).toBe(12);
  });

  it('tire selon les poids sans répéter la carte précédente', () => {
    const stats = { a: { ok: 10, ko: 0 }, b: { ok: 0, ko: 5 } };
    // poids a = 1, b = 12, c = 3 (total 16)
    expect(
      pickWeighted(
        ['a', 'b', 'c'],
        (x) => x,
        stats,
        () => 0,
      ),
    ).toBe('a');
    expect(
      pickWeighted(
        ['a', 'b', 'c'],
        (x) => x,
        stats,
        () => 5,
      ),
    ).toBe('b');
    expect(
      pickWeighted(
        ['a', 'b', 'c'],
        (x) => x,
        stats,
        () => 15,
      ),
    ).toBe('c');
    expect(
      pickWeighted(
        ['a', 'b'],
        (x) => x,
        {},
        () => 0,
        'a',
      ),
    ).toBe('b');
    expect(
      pickWeighted(
        [],
        (x: string) => x,
        {},
        () => 0,
      ),
    ).toBeUndefined();
  });

  it('ne repropose pas les cartes récentes tant qu’il en reste d’autres', () => {
    expect(
      pickWeighted(
        ['a', 'b', 'c'],
        (x) => x,
        {},
        () => 0,
        ['a', 'b'],
      ),
    ).toBe('c');
    expect(
      pickWeighted(
        ['a', 'b'],
        (x) => x,
        {},
        () => 0,
        ['a', 'b'],
      ),
    ).toBe('a');
    let recent: string[] = [];
    for (const k of ['a', 'b', 'c', 'd', 'b']) {
      recent = remember(recent, k, 6);
    }
    expect(recent).toEqual(['c', 'd', 'b']);
    expect(remember([], 'a', 1)).toEqual([]);
  });

  it('propose des choix distincts contenant la bonne réponse', () => {
    const list = choices(
      'eau',
      ['feu', 'eau', 'arbre', 'feu', 'or', 'terre'],
      4,
      sequence(0, 1, 2, 0),
    );
    expect(list).toHaveLength(4);
    expect(list).toContain('eau');
    expect(new Set(list).size).toBe(4);
  });

  it('tient le score, la série et la liste à revoir', () => {
    let score = EMPTY_SCORE;
    for (const ok of [true, true, false, true]) {
      score = nextScore(score, ok);
    }
    expect(score).toEqual({ good: 3, total: 4, streak: 1, best: 2 });
    expect(accuracy(score)).toBe(75);
    expect(accuracy(EMPTY_SCORE)).toBeNull();

    let stats = recordAnswer({}, 'し', false);
    stats = recordAnswer(stats, 'し', false);
    stats = recordAnswer(stats, 'あ', true);
    expect(toReview(stats)).toEqual([{ key: 'し', ko: 2 }]);
  });
});

describe('gomme', () => {
  const line = [
    { x: 0, y: 0.5 },
    { x: 1, y: 0.5 },
  ];
  const other = [
    { x: 0.5, y: 0 },
    { x: 0.5, y: 0.1 },
  ];

  it('coupe un trait en deux là où elle passe, même entre deux points éloignés', () => {
    const result = eraseAt([line], { x: 0.5, y: 0.5 }, 0.05);
    expect(result).toHaveLength(2);
    expect(Math.max(...result[0].map((p) => p.x))).toBeLessThan(0.46);
    expect(Math.min(...result[1].map((p) => p.x))).toBeGreaterThan(0.54);
  });

  it('laisse intacts les traits qu’elle ne touche pas et supprime les miettes', () => {
    expect(eraseAt([line, other], { x: 0.9, y: 0.05 }, 0.05)).toEqual([line, other]);
    expect(eraseAt([other], { x: 0.5, y: 0.05 }, 0.1)).toEqual([]);
  });
});
