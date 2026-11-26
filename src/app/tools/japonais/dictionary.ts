/**
 * Analyse d'une phrase japonaise : découpage en mots (kuromoji), lecture en furigana et rōmaji,
 * sens de chaque mot (mini-dictionnaire tiré de JMdict).
 *
 * Les dictionnaires sont des fichiers statiques du site (`public/japonais/`), téléchargés depuis
 * la même adresse à la première analyse, puis gardés en cache par le navigateur.
 * Aucun texte n'est envoyé nulle part.
 */
import { isKanji, kanaToRomaji, toHiragana } from './kana';

/** Champs utiles d'un mot renvoyé par kuromoji (dictionnaire IPAdic). */
export interface Token {
  readonly surface_form: string;
  readonly pos: string;
  readonly pos_detail_1: string;
  readonly basic_form: string;
  readonly reading?: string;
}

export interface RubySegment {
  readonly text: string;
  readonly ruby?: string;
}

export interface Gloss {
  readonly text: string;
  /** `fr`, `en`, ou `grammaire` pour les particules et auxiliaires expliqués ici. */
  readonly source: 'fr' | 'en' | 'grammaire';
}

export interface Word {
  readonly surface: string;
  readonly ruby: readonly RubySegment[];
  readonly romaji: string;
  readonly pos: string;
  /** Forme du dictionnaire, si elle diffère (食べ → 食べる). */
  readonly lemma?: string;
  readonly gloss?: Gloss;
}

const KANJI_RUN = /[㐀-䶿一-鿿豈-﫿々〆ヵヶ]+|[^㐀-䶿一-鿿豈-﫿々〆ヵヶ]+/gu;

/**
 * Place la lecture au-dessus des seuls kanji : 食べる + たべる → 食(た)べる,
 * お茶 + おちゃ → お茶(ちゃ). Si l'alignement échoue, la lecture couvre tout le mot.
 */
export function furigana(surface: string, reading: string): RubySegment[] {
  const hira = toHiragana(reading);
  if (![...surface].some(isKanji)) {
    return [{ text: surface }];
  }
  if (!hira || hira === toHiragana(surface)) {
    return [{ text: surface }];
  }
  const runs = surface.match(KANJI_RUN) ?? [surface];
  const pattern = runs
    .map((run) => (isKanji([...run][0]) ? '(.+?)' : `(${escapeRegExp(toHiragana(run))})`))
    .join('');
  const match = new RegExp(`^${pattern}$`, 'u').exec(hira);
  if (!match) {
    return [{ text: surface, ruby: hira }];
  }
  return runs.map((run, i) =>
    isKanji([...run][0]) ? { text: run, ruby: match[i + 1] } : { text: run },
  );
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Nature des mots, en français. */
export function posLabel(token: Pick<Token, 'pos' | 'pos_detail_1'>): string {
  const detail: Record<string, string> = {
    代名詞: 'pronom',
    固有名詞: 'nom propre',
    数: 'nombre',
    接尾: 'suffixe',
    形容動詞語幹: 'adjectif en -na',
    副詞可能: 'nom / adverbe',
    非自立: 'auxiliaire',
  };
  const pos: Record<string, string> = {
    名詞: 'nom',
    動詞: 'verbe',
    形容詞: 'adjectif',
    副詞: 'adverbe',
    連体詞: 'déterminant',
    接続詞: 'conjonction',
    助詞: 'particule',
    助動詞: 'auxiliaire',
    感動詞: 'interjection',
    記号: 'ponctuation',
    接頭詞: 'préfixe',
    フィラー: 'hésitation',
  };
  if (token.pos === '名詞' || token.pos === '動詞') {
    return detail[token.pos_detail_1] ?? pos[token.pos];
  }
  return pos[token.pos] ?? 'autre';
}

/** Particules et auxiliaires : le dictionnaire les décrit mal, on les explique ici. */
const GRAMMAR: Readonly<Record<string, string>> = {
  'は|助詞': '(thème de la phrase) quant à…',
  'が|助詞': '(sujet) ; mais',
  'を|助詞': "(complément d'objet direct)",
  'に|助詞': 'à, dans, vers (lieu, moment, but)',
  'へ|助詞': 'vers (direction)',
  'で|助詞': "à, en, avec (lieu de l'action, moyen)",
  'の|助詞': 'de (possession, lien entre noms)',
  'と|助詞': 'et, avec ; (citation)',
  'も|助詞': 'aussi, même',
  'か|助詞': '(question) ; ou',
  'ね|助詞': "(… n'est-ce pas ?)",
  'よ|助詞': '(insistance, information nouvelle)',
  'から|助詞': 'depuis, à partir de ; parce que',
  'まで|助詞': "jusqu'à",
  'より|助詞': 'que (comparaison) ; depuis',
  'て|助詞': '(forme en -te : et, puis)',
  'で|助動詞': '(forme en -te de だ)',
  'ば|助詞': 'si (condition)',
  'けど|助詞': 'mais',
  'けれど|助詞': 'mais',
  'や|助詞': 'et (liste non exhaustive)',
  'ので|助詞': 'parce que',
  'のに|助詞': 'bien que, alors que',
  'し|助詞': 'et en plus',
  'たり|助詞': '(actions données en exemple)',
  'ながら|助詞': 'tout en (faisant)',
  'って|助詞': '(citation, familier)',
  'な|助詞': '(exclamation ; interdiction)',
  'です|助動詞': 'être (poli)',
  'ます|助動詞': '(forme polie du verbe)',
  'た|助動詞': '(passé, action accomplie)',
  'だ|助動詞': 'être (familier)',
  'ない|助動詞': '(négation)',
  'ぬ|助動詞': '(négation, littéraire)',
  'ん|助動詞': '(négation ou explication, familier)',
  'たい|助動詞': 'vouloir (faire)',
  'れる|助動詞': '(passif ou potentiel)',
  'られる|助動詞': '(passif ou potentiel)',
  'せる|助動詞': '(faire faire : causatif)',
  'させる|助動詞': '(faire faire : causatif)',
  'う|助動詞': '(volonté, invitation : faisons…)',
  'よう|助動詞': '(volonté, invitation : faisons…)',
  'らしい|助動詞': 'il semble que',
  'そう|助動詞': "avoir l'air de",
  'この|連体詞': 'ce…-ci (près de moi)',
  'その|連体詞': 'ce…-là (près de vous)',
  'あの|連体詞': 'ce…-là (loin des deux)',
  'どの|連体詞': 'quel… ?',
  'いる|非自立': '(en train de ; état)',
  'ある|非自立': '(état résultant)',
  'しまう|非自立': '(complètement ; à regret)',
  'おく|非自立': "(à l'avance)",
  'みる|非自立': '(essayer de)',
  'くる|非自立': '(se mettre à ; venir)',
  'いく|非自立': '(continuer à)',
  'くださる|非自立': "(s'il vous plaît)",
};

/** Index du mini-dictionnaire : forme écrite → entrées, de la plus à la moins prioritaire. */
export class Glossary {
  private readonly index = new Map<string, number[]>();

  /** `entries` : [kanji « | », kana « | », sens, 1 si le sens est en anglais]. */
  constructor(private readonly entries: readonly (readonly [string, string, string, number])[]) {
    entries.forEach(([kanji, kana], id) => {
      for (const form of [...kanji.split('|'), ...kana.split('|')]) {
        if (form) {
          const list = this.index.get(form);
          if (list) {
            list.push(id);
          } else {
            this.index.set(form, [id]);
          }
        }
      }
    });
  }

  get size(): number {
    return this.entries.length;
  }

  /** Sens d'une forme ; à lecture égale, l'entrée dont un kana correspond est préférée. */
  lookup(form: string, reading?: string): Gloss | undefined {
    const ids = this.index.get(form);
    if (!ids?.length) {
      return undefined;
    }
    const hira = reading ? toHiragana(reading) : '';
    const kanaOf = (i: number) => this.entries[i][1].split('|');
    // D'abord une entrée dont c'est la lecture principale (この → 此の « ce », pas 九 « neuf »).
    const id =
      (hira
        ? (ids.find((i) => kanaOf(i)[0] === hira) ?? ids.find((i) => kanaOf(i).includes(hira)))
        : undefined) ?? ids[0];
    const [, , text, english] = this.entries[id];
    return { text, source: english ? 'en' : 'fr' };
  }
}

export function glossFor(token: Token, glossary: Glossary): Gloss | undefined {
  if (token.pos === '記号') {
    return undefined;
  }
  const lemma = token.basic_form !== '*' ? token.basic_form : token.surface_form;
  const grammarKey =
    token.pos_detail_1 === '非自立' && token.pos === '動詞'
      ? `${lemma}|非自立`
      : `${lemma}|${token.pos}`;
  const grammar = GRAMMAR[grammarKey] ?? GRAMMAR[`${token.surface_form}|${token.pos}`];
  if (
    grammar &&
    (['助詞', '助動詞', '連体詞'].includes(token.pos) || token.pos_detail_1 === '非自立')
  ) {
    return { text: grammar, source: 'grammaire' };
  }
  const isKanaOnly = ![...lemma].some(isKanji);
  const lemmaReading =
    lemma === token.surface_form ? token.reading : isKanaOnly ? lemma : undefined;
  return glossary.lookup(lemma, lemmaReading) ?? glossary.lookup(token.surface_form, token.reading);
}

/** Rōmaji d'un mot ; les particules は, へ, を se prononcent wa, e, o. */
export function wordRomaji(token: Token): string {
  if (token.pos === '助詞') {
    const particle: Record<string, string> = { は: 'wa', へ: 'e', を: 'o' };
    if (particle[token.surface_form]) {
      return particle[token.surface_form];
    }
  }
  return kanaToRomaji(token.reading && token.reading !== '*' ? token.reading : token.surface_form);
}

export function analyze(tokens: readonly Token[], glossary: Glossary): Word[] {
  return tokens
    .filter((t) => t.surface_form.trim())
    .map((t) => {
      const reading = t.reading && t.reading !== '*' ? t.reading : '';
      const lemma =
        t.basic_form !== '*' && t.basic_form !== t.surface_form ? t.basic_form : undefined;
      return {
        surface: t.surface_form,
        ruby: furigana(t.surface_form, reading),
        romaji: t.pos === '記号' ? t.surface_form : wordRomaji(t),
        pos: posLabel(t),
        lemma,
        gloss: glossFor(t, glossary),
      };
    });
}

/** Phrase entière en rōmaji, mots séparés par des espaces, ponctuation collée. */
export function sentenceRomaji(words: readonly Word[]): string {
  return words
    .map((w) => (w.pos === 'ponctuation' ? kanaToRomaji(w.surface) : ` ${w.romaji}`))
    .join('')
    .trim()
    .replace(/\s+([.,?!])/g, '$1');
}

/* ---------- Chargement (navigateur uniquement) ---------- */

export interface Tokenizer {
  tokenize(text: string): Token[];
}

/** Lit un fichier, gzip ou non (certains serveurs décompressent déjà les .gz). */
async function fetchArrayBuffer(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${url} : ${response.status}`);
  }
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes[0] !== 0x1f || bytes[1] !== 0x8b) {
    return bytes.buffer;
  }
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
  return new Response(stream).arrayBuffer();
}

let tokenizerPromise: Promise<Tokenizer> | undefined;
let glossaryPromise: Promise<Glossary> | undefined;

/** Analyseur morphologique kuromoji (dictionnaire IPAdic, ≈ 17 Mo, chargé une fois). */
export function loadTokenizer(dicPath = 'japonais/kuromoji/'): Promise<Tokenizer> {
  tokenizerPromise ??= (async () => {
    const [{ default: DictionaryLoader }, { default: KuromojiTokenizer }] = await Promise.all([
      import('@sglkc/kuromoji/src/loader/DictionaryLoader'),
      import('@sglkc/kuromoji/src/Tokenizer'),
    ]);
    const loader = new DictionaryLoader(dicPath);
    loader.loadArrayBuffer = (url, callback) => {
      fetchArrayBuffer(url).then(
        (buffer) => callback(null, buffer),
        (error: unknown) => callback(error, null),
      );
    };
    return new Promise<Tokenizer>((resolve, reject) => {
      loader.load((error, dic) => (error ? reject(error) : resolve(new KuromojiTokenizer(dic))));
    });
  })().catch((error: unknown) => {
    tokenizerPromise = undefined; // permettre un nouvel essai
    throw error;
  });
  return tokenizerPromise;
}

export function loadGlossary(url = 'japonais/dico.json'): Promise<Glossary> {
  glossaryPromise ??= fetch(url)
    .then((r) => {
      if (!r.ok) {
        throw new Error(`${url} : ${r.status}`);
      }
      return r.json() as Promise<{ entries: [string, string, string, number][] }>;
    })
    .then((data) => new Glossary(data.entries))
    .catch((error: unknown) => {
      glossaryPromise = undefined;
      throw error;
    });
  return glossaryPromise;
}
