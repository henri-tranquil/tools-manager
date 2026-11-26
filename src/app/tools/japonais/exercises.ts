/**
 * Générateur d'exercices de grammaire (niveau N5) à correction exacte et expliquée :
 * particules, conjugaison, nombres et compteurs, lecture de mots en kanji. Fonctions pures.
 */
import type { RandomInt } from '../../shared/random';
import {
  FALSE_ICHIDAN,
  PARTICLE_TEMPLATES,
  PARTICLES,
  ParticleTemplate,
  SLOTS,
  Verb,
  VERBS,
} from './data/grammar';
import { KANJI } from './data/kanji';
import { VOCAB, VocabWord } from './data/vocab';
import { furigana } from './dictionary';
import { matchesReading, toHiragana } from './kana';
import { shuffle } from './quiz';

export type ExerciseKind = 'particules' | 'conjugaison' | 'nombres' | 'kanji';

export const EXERCISE_KINDS: readonly { id: ExerciseKind; label: string }[] = [
  { id: 'particules', label: 'Particules' },
  { id: 'conjugaison', label: 'Conjugaison' },
  { id: 'nombres', label: 'Nombres et compteurs' },
  { id: 'kanji', label: 'Lecture de kanji' },
];

/** Erreur classique reconnue, avec son explication. */
export interface Trap {
  readonly answers: readonly string[];
  readonly message: string;
}

export interface Exercise {
  readonly kind: ExerciseKind;
  /** Identifiant stable (statistiques, pas de doublon dans une fiche). */
  readonly key: string;
  readonly instruction: string;
  /** Texte japonais de la question ; `（　）` marque la case à remplir. */
  readonly question: string;
  /** Sens ou précision, en français. */
  readonly hint: string;
  /** Présent : QCM ; absent : réponse tapée (kana ou rōmaji). */
  readonly choices?: readonly string[];
  /** Réponses acceptées : kana, ou texte exact pour un QCM. */
  readonly answers: readonly string[];
  /** Réponse affichée à la correction. */
  readonly solution: string;
  readonly explanation: string;
  readonly traps?: readonly Trap[];
}

export const BLANK = '（　）';

/* ---------- Correction ---------- */

const compact = (text: string) => text.replace(/[\s　]/g, '');

/** La réponse est-elle juste ? Au clavier : kana, rōmaji ou forme écrite exacte. */
export function checkExercise(exercise: Exercise, answer: string): boolean {
  const typed = answer.trim();
  if (!typed) {
    return false;
  }
  if (exercise.choices) {
    return exercise.answers.includes(typed);
  }
  return exercise.answers.some(
    (a) => compact(a) === compact(typed) || (/^[ぁ-ゖー]+$/.test(a) && matchesReading(typed, a)),
  );
}

/** Message propre à une erreur classique, s'il y en a un. */
export function diagnose(exercise: Exercise, answer: string): string | null {
  const typed = answer.trim();
  const trap = exercise.traps?.find((t) =>
    t.answers.some(
      (a) => compact(a) === compact(typed) || (/^[ぁ-ゖー]+$/.test(a) && matchesReading(typed, a)),
    ),
  );
  return trap?.message ?? null;
}

/* ---------- Conjugaison ---------- */

export type VerbForm = 'masu' | 'masen' | 'mashita' | 'te' | 'ta' | 'nai';

export const VERB_FORMS: Readonly<Record<VerbForm, { ja: string; fr: string }>> = {
  masu: { ja: '〜ます', fr: 'poli, présent' },
  masen: { ja: '〜ません', fr: 'poli, négatif' },
  mashita: { ja: '〜ました', fr: 'poli, passé' },
  te: { ja: '〜て', fr: 'forme en て' },
  ta: { ja: '〜た', fr: 'neutre, passé' },
  nai: { ja: '〜ない', fr: 'neutre, négatif' },
};

const I_ROW: Readonly<Record<string, string>> = {
  う: 'い',
  く: 'き',
  ぐ: 'ぎ',
  す: 'し',
  つ: 'ち',
  ぬ: 'に',
  ぶ: 'び',
  む: 'み',
  る: 'り',
};
const A_ROW: Readonly<Record<string, string>> = {
  う: 'わ',
  く: 'か',
  ぐ: 'が',
  す: 'さ',
  つ: 'た',
  ぬ: 'な',
  ぶ: 'ば',
  む: 'ま',
  る: 'ら',
};
const TE: Readonly<Record<string, string>> = {
  う: 'って',
  つ: 'って',
  る: 'って',
  く: 'いて',
  ぐ: 'いで',
  す: 'して',
  ぬ: 'んで',
  ぶ: 'んで',
  む: 'んで',
};

const ENDINGS: Readonly<Record<Exclude<VerbForm, 'te' | 'ta' | 'nai'>, string>> = {
  masu: 'ます',
  masen: 'ません',
  mashita: 'ました',
};

/** Terminaison qui remplace la dernière syllabe, selon le groupe donné (pour simuler une erreur). */
function tail(r: string, group: 1 | 2, form: VerbForm): string {
  if (group === 2) {
    return form === 'te' ? 'て' : form === 'ta' ? 'た' : form === 'nai' ? 'ない' : ENDINGS[form];
  }
  const last = r.at(-1) ?? '';
  const te = r === 'いく' ? 'って' : (TE[last] ?? '');
  switch (form) {
    case 'te':
      return te;
    case 'ta':
      return te.replace(/て$/, 'た').replace(/で$/, 'だ');
    case 'nai':
      return (A_ROW[last] ?? '') + 'ない';
    default:
      return (I_ROW[last] ?? '') + ENDINGS[form];
  }
}

const IRREGULAR: Readonly<Record<'する' | 'くる', Readonly<Record<VerbForm, string>>>> = {
  する: {
    masu: 'します',
    masen: 'しません',
    mashita: 'しました',
    te: 'して',
    ta: 'した',
    nai: 'しない',
  },
  くる: {
    masu: 'きます',
    masen: 'きません',
    mashita: 'きました',
    te: 'きて',
    ta: 'きた',
    nai: 'こない',
  },
};

export interface Conjugated {
  /** En hiragana. */
  readonly kana: string;
  /** Avec les kanji de la forme du dictionnaire. */
  readonly written: string;
}

export function conjugate(verb: Verb, form: VerbForm): Conjugated {
  if (verb.group === 3) {
    const base = verb.r.endsWith('する') ? 'する' : 'くる';
    const kana = verb.r.slice(0, -2) + IRREGULAR[base][form];
    // 来る : le kanji garde sa place (来ます, 来ない), seule la lecture change.
    const written =
      base === 'くる' && verb.w.endsWith('来る')
        ? verb.w.slice(0, -1).replace(/る$/, '') + IRREGULAR[base][form].slice(1)
        : verb.w.slice(0, -2) + IRREGULAR[base][form];
    return { kana, written };
  }
  if (verb.r === 'ある' && form === 'nai') {
    return { kana: 'ない', written: 'ない' };
  }
  const end = tail(verb.r, verb.group, form);
  return { kana: verb.r.slice(0, -1) + end, written: verb.w.slice(0, -1) + end };
}

function explainConjugation(verb: Verb, form: VerbForm): string {
  if (verb.group === 3) {
    return verb.r.endsWith('する')
      ? 'する est irrégulier : します, しません, して, した, しない. Les verbes en 〜する (べんきょうする) se conjuguent pareil.'
      : '来る (くる) est irrégulier : la lecture change, きます, きて, きた, mais こない.';
  }
  if (verb.r === 'ある' && form === 'nai') {
    return 'Exception : la forme négative neutre de ある est ない (et non あらない).';
  }
  if (verb.group === 2) {
    return `Groupe 2 (ichidan, finale -iru/-eru) : on retire る et on ajoute ${tail(verb.r, 2, form)}.`;
  }
  const last = verb.r.at(-1) ?? '';
  const warning = FALSE_ICHIDAN.has(verb.r)
    ? ` Attention : ${verb.r} finit en -iru/-eru mais appartient au groupe 1.`
    : '';
  const rule = (() => {
    switch (form) {
      case 'te':
      case 'ta': {
        if (verb.r === 'いく') {
          return 'Exception : 行く donne 行って / 行った.';
        }
        const groups: Record<string, string> = {
          う: 'う, つ, る → って',
          つ: 'う, つ, る → って',
          る: 'う, つ, る → って',
          く: 'く → いて',
          ぐ: 'ぐ → いで',
          す: 'す → して',
          ぬ: 'む, ぶ, ぬ → んで',
          ぶ: 'む, ぶ, ぬ → んで',
          む: 'む, ぶ, ぬ → んで',
        };
        return `Groupe 1 (godan), forme en て : ${groups[last]}${form === 'ta' ? ' (et て → た, で → だ)' : ''}.`;
      }
      case 'nai':
        return `Groupe 1 (godan) : la dernière syllabe passe en -a (${last} → ${A_ROW[last]}${last === 'う' ? ', う donne わ' : ''}) puis ない.`;
      default:
        return `Groupe 1 (godan) : la dernière syllabe passe en -i (${last} → ${I_ROW[last]}) puis ${ENDINGS[form]}.`;
    }
  })();
  return rule + warning;
}

function conjugationExercise(verb: Verb, form: VerbForm): Exercise {
  const target = conjugate(verb, form);
  const traps: Trap[] = [];
  if (verb.group !== 3) {
    const other = verb.group === 1 ? 2 : 1;
    const wrong = verb.r.slice(0, -1) + tail(verb.r, other, form);
    if (wrong !== target.kana) {
      traps.push({
        answers: [wrong],
        message: `Vous avez conjugué ${verb.w} comme un verbe du groupe ${other} : il est du groupe ${verb.group}.`,
      });
    }
  }
  return {
    kind: 'conjugaison',
    key: `conj:${verb.r}:${form}`,
    instruction: `Conjuguez à la forme ${VERB_FORMS[form].ja} (${VERB_FORMS[form].fr})`,
    question: `${verb.w} → ${BLANK}`,
    hint: `${verb.fr} · ${VERB_FORMS[form].fr}`,
    answers: [target.kana, target.written],
    solution: target.written === target.kana ? target.kana : `${target.written}（${target.kana}）`,
    explanation: explainConjugation(verb, form),
    traps,
  };
}

/* ---------- Nombres et compteurs ---------- */

const DIGITS = ['', 'いち', 'に', 'さん', 'よん', 'ご', 'ろく', 'なな', 'はち', 'きゅう'];
const HUNDREDS = [
  '',
  'ひゃく',
  'にひゃく',
  'さんびゃく',
  'よんひゃく',
  'ごひゃく',
  'ろっぴゃく',
  'ななひゃく',
  'はっぴゃく',
  'きゅうひゃく',
];
const THOUSANDS = [
  '',
  'せん',
  'にせん',
  'さんぜん',
  'よんせん',
  'ごせん',
  'ろくせん',
  'ななせん',
  'はっせん',
  'きゅうせん',
];

const tensOf = (d: number) => (d === 0 ? '' : d === 1 ? 'じゅう' : DIGITS[d] + 'じゅう');

/** Lecture d'un nombre de 0 à 99 999 (300 → さんびゃく, 8 000 → はっせん). */
export function numberReading(n: number): string {
  if (!Number.isInteger(n) || n < 0 || n > 99_999) {
    throw new RangeError(`Nombre hors limites : ${n}`);
  }
  if (n === 0) {
    return 'ゼロ';
  }
  const man = Math.floor(n / 10_000);
  const rest = n % 10_000;
  return (
    (man ? DIGITS[man] + 'まん' : '') +
    THOUSANDS[Math.floor(rest / 1000)] +
    HUNDREDS[Math.floor(rest / 100) % 10] +
    tensOf(Math.floor(rest / 10) % 10) +
    DIGITS[rest % 10]
  );
}

/** Lecture « naïve », sans changement de son (pour reconnaître l'erreur). */
function naiveNumber(n: number): string {
  const d = (x: number) => DIGITS[x];
  const th = Math.floor(n / 1000) % 10;
  const h = Math.floor(n / 100) % 10;
  return (
    (th ? (th === 1 ? '' : d(th)) + 'せん' : '') +
    (h ? (h === 1 ? '' : d(h)) + 'ひゃく' : '') +
    tensOf(Math.floor(n / 10) % 10) +
    d(n % 10)
  );
}

const MINUTE_UNITS = [
  '',
  'いっぷん',
  'にふん',
  'さんぷん',
  'よんぷん',
  'ごふん',
  'ろっぷん',
  'ななふん',
  'はっぷん',
  'きゅうふん',
];

export function minuteReading(m: number): string[] {
  const tens = Math.floor(m / 10);
  const unit = m % 10;
  if (unit === 0) {
    const prefix = tens === 1 ? '' : DIGITS[tens];
    return [prefix + 'じゅっぷん', prefix + 'じっぷん'];
  }
  return [tensOf(tens) + MINUTE_UNITS[unit]];
}

export function hourReading(h: number): string[] {
  const special: Record<number, string[]> = {
    4: ['よじ'],
    7: ['しちじ', 'ななじ'],
    9: ['くじ'],
  };
  return special[h] ?? [`${tensOf(Math.floor(h / 10))}${DIGITS[h % 10]}じ`];
}

const TSU = [
  '',
  'ひとつ',
  'ふたつ',
  'みっつ',
  'よっつ',
  'いつつ',
  'むっつ',
  'ななつ',
  'やっつ',
  'ここのつ',
  'とお',
];
const NIN: readonly (readonly string[])[] = [
  [],
  ['ひとり'],
  ['ふたり'],
  ['さんにん'],
  ['よにん'],
  ['ごにん'],
  ['ろくにん'],
  ['しちにん', 'ななにん'],
  ['はちにん'],
  ['きゅうにん'],
  ['じゅうにん'],
];
const HON = [
  '',
  'いっぽん',
  'にほん',
  'さんぼん',
  'よんほん',
  'ごほん',
  'ろっぽん',
  'ななほん',
  'はっぽん',
  'きゅうほん',
  'じゅっぽん',
];
const MONTHS = [
  '',
  'いちがつ',
  'にがつ',
  'さんがつ',
  'しがつ',
  'ごがつ',
  'ろくがつ',
  'しちがつ',
  'はちがつ',
  'くがつ',
  'じゅうがつ',
  'じゅういちがつ',
  'じゅうにがつ',
];
const SPECIAL_DAYS: Readonly<Record<number, string>> = {
  1: 'ついたち',
  2: 'ふつか',
  3: 'みっか',
  4: 'よっか',
  5: 'いつか',
  6: 'むいか',
  7: 'なのか',
  8: 'ようか',
  9: 'ここのか',
  10: 'とおか',
  14: 'じゅうよっか',
  20: 'はつか',
  24: 'にじゅうよっか',
};

export function dayReading(d: number): string {
  if (SPECIAL_DAYS[d]) {
    return SPECIAL_DAYS[d];
  }
  const unit = d % 10;
  const unitReading = unit === 7 ? 'しち' : unit === 9 ? 'く' : DIGITS[unit];
  return tensOf(Math.floor(d / 10)) + unitReading + 'にち';
}

type CounterId = 'nombre' | 'heure' | 'minute' | 'tsu' | 'nin' | 'hon' | 'mois' | 'jour';

const COUNTER_IDS: readonly CounterId[] = [
  'nombre',
  'heure',
  'minute',
  'tsu',
  'nin',
  'hon',
  'mois',
  'jour',
];

const FR_NUMBER = new Intl.NumberFormat('fr-FR');

/** Exercice de lecture d'un nombre ou d'un compteur. */
export function counterExercise(counter: CounterId, n: number): Exercise {
  const make = (
    question: string,
    hint: string,
    answers: readonly string[],
    explanation: string,
    naive?: string,
  ): Exercise => ({
    kind: 'nombres',
    key: `num:${counter}:${n}`,
    instruction: 'Écrivez la lecture (en kana ou en rōmaji)',
    question,
    hint,
    answers,
    solution: `${question} ・ ${answers[0]}`,
    explanation,
    traps:
      naive && !answers.includes(naive)
        ? [
            {
              answers: [naive],
              message: `Presque : attention au changement de son. ${explanation}`,
            },
          ]
        : [],
  });
  switch (counter) {
    case 'nombre':
      return make(
        FR_NUMBER.format(n).replace(/\s/g, ' '),
        'un nombre',
        [numberReading(n)],
        'Un nombre se lit par blocs : まん (10 000), せん (1 000), ひゃく (100), じゅう (10), puis l’unité. Sons qui changent : 300 さんびゃく, 600 ろっぴゃく, 800 はっぴゃく, 3 000 さんぜん, 8 000 はっせん.',
        naiveNumber(n),
      );
    case 'heure':
      return make(
        `${n}時`,
        `${n} heure${n > 1 ? 's' : ''}`,
        hourReading(n),
        'Heure = nombre + じ, avec trois lectures à retenir : 4 時 よじ, 7 時 しちじ, 9 時 くじ.',
        `${tensOf(Math.floor(n / 10))}${DIGITS[n % 10]}じ`,
      );
    case 'minute':
      return make(
        `${n}分`,
        `${n} minute${n > 1 ? 's' : ''}`,
        minuteReading(n),
        'Minutes = nombre + ふん, qui devient ぷん après 1, 3, 4, 6, 8 et 10 (いっぷん, さんぷん, じゅっぷん).',
        `${tensOf(Math.floor(n / 10))}${DIGITS[n % 10]}ふん`,
      );
    case 'tsu':
      return make(
        `${n}つ`,
        `${n} objet${n > 1 ? 's' : ''} (compteur général)`,
        [TSU[n]],
        'Compteur japonais d’origine (ひとつ, ふたつ, みっつ…) pour les objets sans forme particulière ; il s’arrête à 10 (とお).',
      );
    case 'nin':
      return make(
        `${n}人`,
        `${n} personne${n > 1 ? 's' : ''}`,
        NIN[n],
        'Personnes : ひとり, ふたり pour 1 et 2, puis nombre + にん, avec 4 人 よにん.',
        `${DIGITS[n] || 'じゅう'}にん`,
      );
    case 'hon':
      return make(
        `${n}本`,
        `${n} objet${n > 1 ? 's' : ''} long${n > 1 ? 's' : ''} (stylo, bouteille)`,
        [HON[n]],
        'Objets longs : ほん devient ぽん après 1, 6, 8, 10 (いっぽん, ろっぽん) et ぼん après 3 (さんぼん).',
        `${DIGITS[n] || 'じゅう'}ほん`,
      );
    case 'mois':
      return make(
        `${n}月`,
        `le mois n° ${n}`,
        [MONTHS[n]],
        'Mois = nombre + がつ, avec 4 月 しがつ, 7 月 しちがつ, 9 月 くがつ.',
        `${tensOf(Math.floor(n / 10))}${DIGITS[n % 10]}がつ`,
      );
    case 'jour':
      return make(
        `${n}日`,
        `le ${n === 1 ? '1er' : n} du mois`,
        [dayReading(n)],
        'Du 1er au 10 du mois, une lecture propre (ついたち, ふつか, みっか…), comme le 14 (じゅうよっか), le 20 (はつか) et le 24 ; sinon nombre + にち.',
        `${tensOf(Math.floor(n / 10))}${DIGITS[n % 10]}にち`,
      );
  }
}

function randomNumberFor(counter: CounterId, random: RandomInt): number {
  switch (counter) {
    case 'nombre': {
      // Des nombres « piégeux » : 3, 6 ou 8 en centaines et en milliers une fois sur deux.
      const tricky = [3, 6, 8];
      const pick = (bias: boolean) => (bias ? tricky[random(3)] : random(10));
      return pick(random(2) === 0) * 1000 + pick(random(2) === 0) * 100 + random(100);
    }
    case 'heure':
      return 1 + random(12);
    case 'minute':
      return [1, 3, 4, 5, 6, 8, 10, 15, 20, 30, 45, 2, 7, 9][random(14)];
    case 'mois':
      return 1 + random(12);
    case 'jour':
      return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 14, 20, 24, 11, 17, 19][random(16)];
    default:
      return 1 + random(10);
  }
}

/* ---------- Particules ---------- */

/** Remplit un modèle avec des mots tirés au sort. */
export function particleExercise(template: ParticleTemplate, random: RandomInt): Exercise {
  const picked: Record<string, { ja: string; fr: string }> = {};
  const fill = (text: string, lang: 'ja' | 'fr') =>
    text.replace(/\{(\w+)\}/g, (_, slot: string) => {
      const options = SLOTS[slot] ?? [];
      picked[slot] ??= options[random(options.length)];
      return picked[slot]?.[lang] ?? '';
    });
  const ja = fill(template.ja, 'ja');
  const fr = fill(template.fr, 'fr');
  const correct = template.answers[0];
  const excluded = new Set(['は', 'も', ...(template.exclude ?? [])]);
  const pool = PARTICLES.filter((p) => !template.answers.includes(p) && !excluded.has(p));
  const traps = Object.entries(template.traps ?? {}).map(([particle, message]) => ({
    answers: [particle],
    message,
  }));
  // Les pièges d'abord parmi les intrus, pour que le QCM teste la vraie difficulté.
  const distractors = [
    ...traps.map((t) => t.answers[0]),
    ...shuffle(pool, random).filter((p) => !(p in (template.traps ?? {}))),
  ].slice(0, 3);
  return {
    kind: 'particules',
    key: `part:${template.id}:${Object.values(picked)
      .map((p) => p.ja)
      .join('|')}`,
    instruction: 'Choisissez la particule qui convient',
    question: ja.replace('＿', BLANK),
    hint: fr,
    choices: shuffle([correct, ...distractors], random),
    answers: template.answers,
    solution: ja.replace('＿', template.answers.join(' / ')),
    explanation: template.rule,
    traps,
  };
}

/* ---------- Lecture de mots en kanji ---------- */

const KANJI_INFO = new Map(KANJI.map((k) => [k.k, k]));

const SMALL_TSU = (r: string) => r.replace(/[くきちつ]$/, 'っ');
const RENDAKU: Readonly<Record<string, string>> = {
  か: 'が',
  き: 'ぎ',
  く: 'ぐ',
  け: 'げ',
  こ: 'ご',
  さ: 'ざ',
  し: 'じ',
  す: 'ず',
  せ: 'ぜ',
  そ: 'ぞ',
  た: 'だ',
  ち: 'ぢ',
  つ: 'づ',
  て: 'で',
  と: 'ど',
  は: 'ば',
  ひ: 'び',
  ふ: 'ぶ',
  へ: 'べ',
  ほ: 'ぼ',
};

/** Lectures possibles d'un kanji, avec leur type ; contractions (がく → がっ) et sonorisation comprises. */
function candidates(kanji: string): { reading: string; type: 'on' | 'kun' }[] {
  const info = KANJI_INFO.get(kanji);
  if (!info) {
    return [];
  }
  const out: { reading: string; type: 'on' | 'kun' }[] = [];
  const add = (reading: string, type: 'on' | 'kun') => {
    for (const r of [reading, SMALL_TSU(reading)]) {
      out.push({ reading: r, type });
      if (RENDAKU[r[0]]) {
        out.push({ reading: RENDAKU[r[0]] + r.slice(1), type });
      }
    }
  };
  info.on.forEach((r) => add(toHiragana(r), 'on'));
  info.kun.forEach((r) => add(r.split('.')[0], 'kun'));
  return out;
}

/** Découpe la lecture d'un groupe de kanji kanji par kanji, si les lectures connues le permettent. */
function splitRun(
  run: string,
  reading: string,
): { kanji: string; reading: string; type: 'on' | 'kun' }[] | null {
  const chars = [...run];
  const walk = (
    i: number,
    rest: string,
  ): { kanji: string; reading: string; type: 'on' | 'kun' }[] | null => {
    if (i === chars.length) {
      return rest === '' ? [] : null;
    }
    for (const c of candidates(chars[i])) {
      if (c.reading && rest.startsWith(c.reading)) {
        const tail = walk(i + 1, rest.slice(c.reading.length));
        if (tail) {
          return [{ kanji: chars[i], reading: c.reading, type: c.type }, ...tail];
        }
      }
    }
    return null;
  };
  return walk(0, reading);
}

/** Explique la lecture kanji par kanji, en précisant on (sino-japonaise) ou kun (japonaise). */
export function explainReading(word: VocabWord): string {
  const parts = furigana(word.w, word.r)
    .filter((s) => s.ruby)
    .flatMap((s) => {
      const split = splitRun(s.text, s.ruby ?? '');
      return split
        ? split.map((p) => `${p.kanji} → ${p.reading} (${p.type})`)
        : [`${s.text} → ${s.ruby} (lecture propre à ce mot, à retenir)`];
    });
  const detail = parts.length ? parts.join(' · ') : `${word.w} se lit ${word.r}`;
  return `${detail}. Plusieurs kanji ensemble prennent souvent la lecture on ; un kanji seul ou suivi de kana, plutôt la lecture kun.`;
}

export function kanjiExercise(word: VocabWord): Exercise {
  return {
    kind: 'kanji',
    key: `kanji:${word.w}`,
    instruction: 'Lisez ce mot (en kana ou en rōmaji)',
    question: word.w,
    hint: word.fr,
    answers: [word.r],
    solution: `${word.w} ・ ${word.r}`,
    explanation: explainReading(word),
  };
}

/* ---------- Tirage ---------- */

const FORMS = Object.keys(VERB_FORMS) as VerbForm[];

export function generateExercise(kind: ExerciseKind, random: RandomInt): Exercise {
  switch (kind) {
    case 'particules':
      return particleExercise(PARTICLE_TEMPLATES[random(PARTICLE_TEMPLATES.length)], random);
    case 'conjugaison':
      return conjugationExercise(VERBS[random(VERBS.length)], FORMS[random(FORMS.length)]);
    case 'nombres': {
      const counter = COUNTER_IDS[random(COUNTER_IDS.length)];
      return counterExercise(counter, randomNumberFor(counter, random));
    }
    case 'kanji':
      return kanjiExercise(VOCAB[random(VOCAB.length)]);
  }
}

/** Une fiche de `count` exercices différents, en alternant les types choisis. */
export function makeSheet(
  kinds: readonly ExerciseKind[],
  count: number,
  random: RandomInt,
): Exercise[] {
  const sheet: Exercise[] = [];
  const seen = new Set<string>();
  const order = shuffle(kinds.length ? kinds : EXERCISE_KINDS.map((k) => k.id), random);
  for (let i = 0, tries = 0; sheet.length < count && tries < count * 20; tries++) {
    const exercise = generateExercise(order[i % order.length], random);
    if (!seen.has(exercise.key)) {
      seen.add(exercise.key);
      sheet.push(exercise);
      i++;
    }
  }
  return sheet;
}

/** QCM de lecture pour l'examen blanc : la bonne lecture et des lectures proches. */
export function readingDistractors(
  reading: string,
  others: readonly string[],
  random: RandomInt,
): string[] {
  const variants = new Set<string>();
  const dakuten: Record<string, string> = {
    か: 'が',
    が: 'か',
    き: 'ぎ',
    ぎ: 'き',
    く: 'ぐ',
    ぐ: 'く',
    こ: 'ご',
    ご: 'こ',
    さ: 'ざ',
    し: 'じ',
    じ: 'し',
    せ: 'ぜ',
    ぜ: 'せ',
    た: 'だ',
    て: 'で',
    で: 'て',
    は: 'ば',
    ば: 'は',
    ひ: 'び',
    ほ: 'ぼ',
    ぼ: 'ほ',
  };
  // Voyelle longue en trop ou en moins, petit っ, sonorisation de la première syllabe.
  if (/[おう]う/.test(reading)) {
    variants.add(reading.replace(/([おこそとのほもよろごぞどぼぽょ])う/, '$1'));
  } else {
    variants.add(reading.replace(/([こそとのほもよろごぞどぼょ])/, '$1う'));
  }
  if (reading.includes('っ')) {
    variants.add(reading.replace('っ', 'つ'));
  } else if (reading.length > 2) {
    variants.add(reading.slice(0, 2) + 'っ' + reading.slice(2));
  }
  const first = reading[0];
  if (dakuten[first]) {
    variants.add(dakuten[first] + reading.slice(1));
  }
  variants.delete(reading);
  const distractors = [
    ...new Set([...shuffle([...variants], random), ...shuffle(others, random)]),
  ].filter((r) => r && r !== reading);
  return shuffle([reading, ...distractors.slice(0, 3)], random);
}
