/**
 * Examen blanc du JLPT N5 : composition des trois épreuves et notation. Fonctions pures.
 *
 * Le vrai JLPT note sur une échelle ajustée à chaque session (théorie des réponses aux items) :
 * ici, le score est une simple règle de trois, donc une estimation.
 */
import type { RandomInt } from '../../shared/random';
import { DIALOGUES, REPLIES } from './data/listening';
import {
  CONFUSABLE,
  CONTEXT_ITEMS,
  GRAMMAR_ITEMS,
  PARAPHRASE_ITEMS,
  READING_ITEMS,
} from './data/jlpt';
import { PARTICLE_TEMPLATES } from './data/grammar';
import { PHRASES } from './data/phrases';
import { VOCAB, VocabWord } from './data/vocab';
import { particleExercise, readingDistractors } from './exercises';
import type { Line } from './japanese';
import { dialogueLines, replyLines, shuffleChoices } from './listening';
import { parsePhrase } from './phrases';
import { shuffle } from './quiz';
import { chunks } from './translation-game';

export type SectionId = 'moji' | 'bunpou' | 'choukai';

export type QuestionType =
  'yomi' | 'hyouki' | 'bunmyaku' | 'iikae' | 'bunpou' | 'kumitate' | 'dokkai' | 'kadai' | 'sokuji';

export const TYPE_LABELS: Readonly<Record<QuestionType, { ja: string; fr: string; help: string }>> =
  {
    yomi: { ja: '漢字読み', fr: 'Lecture des kanji', help: 'Comment se lit le mot souligné ?' },
    hyouki: { ja: '表記', fr: 'Écriture', help: 'Comment s’écrit le mot souligné ?' },
    bunmyaku: { ja: '文脈規定', fr: 'Mot en contexte', help: 'Quel mot convient dans la phrase ?' },
    iikae: {
      ja: '言い換え類義',
      fr: 'Reformulation',
      help: 'Quelle phrase a le même sens ?',
    },
    bunpou: {
      ja: '文法形式の判断',
      fr: 'Grammaire',
      help: 'Quelle forme convient dans la phrase ?',
    },
    kumitate: {
      ja: '文の組み立て',
      fr: 'Construction de phrase',
      help: 'Remettez les quatre morceaux dans l’ordre : lequel va à la place de ★ ?',
    },
    dokkai: { ja: '読解', fr: 'Compréhension écrite', help: 'Lisez le texte et répondez.' },
    kadai: {
      ja: '課題理解・ポイント理解',
      fr: 'Compréhension de dialogues',
      help: 'Lisez la situation et la question, écoutez, puis répondez.',
    },
    sokuji: {
      ja: '即時応答',
      fr: 'Réponse immédiate',
      help: 'Écoutez la phrase et les trois réponses : laquelle convient ?',
    },
  };

export interface ExamQuestion {
  readonly id: string;
  readonly type: QuestionType;
  /** Texte japonais : `（　）` pour une case, `[[…]]` pour la partie soulignée. */
  readonly prompt: string;
  /** Précision en français (sens du mot, traduction de la question). */
  readonly note?: string;
  /** Texte à lire (compréhension écrite). */
  readonly passage?: string;
  /** Situation et question lues avant l'écoute (dialogues). */
  readonly situation?: string;
  /** Piste à écouter. */
  readonly audio?: readonly Line[];
  /** Propositions cachées jusqu'à la correction (réponse immédiate : seuls les numéros). */
  readonly hiddenOptions?: boolean;
  readonly options: readonly string[];
  readonly answer: number;
  readonly explanation: string;
}

export interface ExamSection {
  readonly id: SectionId;
  readonly ja: string;
  readonly fr: string;
  readonly minutes: number;
  readonly questions: readonly ExamQuestion[];
}

export type ExamFormat = 'complet' | 'court';

type Plan = Readonly<
  Record<SectionId, { minutes: number; counts: Partial<Record<QuestionType, number>> }>
>;

/** Durées officielles du N5 (20, 40 et 30 minutes) ; le format court en garde les proportions. */
export const PLANS: Readonly<Record<ExamFormat, Plan>> = {
  complet: {
    moji: { minutes: 20, counts: { yomi: 7, hyouki: 5, bunmyaku: 6, iikae: 3 } },
    bunpou: { minutes: 40, counts: { bunpou: 9, kumitate: 4, dokkai: 4 } },
    choukai: { minutes: 30, counts: { kadai: 7, sokuji: 5 } },
  },
  court: {
    moji: { minutes: 7, counts: { yomi: 3, hyouki: 2, bunmyaku: 2, iikae: 1 } },
    bunpou: { minutes: 13, counts: { bunpou: 4, kumitate: 1, dokkai: 1 } },
    choukai: { minutes: 10, counts: { kadai: 3, sokuji: 2 } },
  },
};

const SECTION_TITLES: Readonly<Record<SectionId, { ja: string; fr: string }>> = {
  moji: { ja: '言語知識（文字・語彙）', fr: 'Vocabulaire' },
  bunpou: { ja: '言語知識（文法）・読解', fr: 'Grammaire et lecture' },
  choukai: { ja: '聴解', fr: 'Écoute' },
};

/* ---------- Générateurs par type ---------- */

function fromChoices(
  id: string,
  type: QuestionType,
  prompt: string,
  choices: readonly string[],
  explanation: string,
  random: RandomInt,
  extra: Partial<ExamQuestion> = {},
): ExamQuestion {
  const { options, answer } = shuffleChoices(choices, random);
  return { id, type, prompt, options, answer, explanation, ...extra };
}

function yomi(word: VocabWord, random: RandomInt): ExamQuestion {
  const others = VOCAB.filter((w) => w.r !== word.r && w.r.length === word.r.length).map(
    (w) => w.r,
  );
  const options = readingDistractors(word.r, others, random);
  return {
    id: `yomi:${word.w}`,
    type: 'yomi',
    prompt: `[[${word.w}]]`,
    note: word.fr,
    options,
    answer: options.indexOf(word.r),
    explanation: `${word.w} se lit ${word.r} (${word.fr}).`,
  };
}

/** Écritures fautives : un kanji remplacé par un voisin facile à confondre. */
export function misspellings(word: string): string[] {
  const chars = [...word];
  const out = new Set<string>();
  chars.forEach((c, i) => {
    for (const group of CONFUSABLE.filter((g) => g.includes(c))) {
      for (const alt of group.filter((a) => a !== c)) {
        out.add([...chars.slice(0, i), alt, ...chars.slice(i + 1)].join(''));
      }
    }
  });
  out.delete(word);
  return [...out];
}

const SPELLABLE = VOCAB.filter((w) => misspellings(w.w).length >= 3);

function hyouki(word: VocabWord, random: RandomInt): ExamQuestion {
  const wrong = shuffle(misspellings(word.w), random).slice(0, 3);
  return fromChoices(
    `hyouki:${word.w}`,
    'hyouki',
    `[[${word.r}]]`,
    [word.w, ...wrong],
    `${word.r} (${word.fr}) s’écrit ${word.w}.`,
    random,
    { note: word.fr },
  );
}

const KUMITATE_PHRASES = PHRASES.map(parsePhrase).filter((p) => {
  const c = chunks(p);
  return c.length >= 5 && new Set(c).size === c.length;
});

/** Construction de phrase : quatre morceaux à remettre dans l'ordre, ★ sur le troisième. */
export function kumitate(index: number, random: RandomInt): ExamQuestion {
  const phrase = KUMITATE_PHRASES[index % KUMITATE_PHRASES.length];
  const parts = chunks(phrase);
  // Le dernier morceau (le verbe) reste visible, comme à l'examen.
  const start = random(parts.length - 4);
  const hidden = parts.slice(start, start + 4);
  const prompt = [
    ...parts.slice(0, start),
    '＿＿＿ ＿＿＿ ★ ＿＿＿',
    ...parts.slice(start + 4),
  ].join(' ');
  const options = shuffle(hidden, random);
  return {
    id: `kumitate:${phrase.id}`,
    type: 'kumitate',
    prompt: `${prompt}。`,
    options,
    answer: options.indexOf(hidden[2]),
    explanation: `Phrase complète : ${phrase.text} (« ${phrase.fr} »). Le morceau en ★ est ${hidden[2]}.`,
  };
}

/**
 * Tire `n` éléments en donnant la priorité à ceux jamais vus, puis aux plus anciennement vus.
 * `seen` : identifiants des questions déjà posées, du plus ancien au plus récent.
 */
export function pickFresh<T>(
  list: readonly T[],
  n: number,
  key: (item: T) => string,
  seen: readonly string[],
  random: RandomInt,
): T[] {
  const lastSeen = new Map(seen.map((id, i) => [id, i]));
  const fresh = shuffle(
    list.filter((x) => !lastSeen.has(key(x))),
    random,
  );
  const stale = shuffle(
    list.filter((x) => lastSeen.has(key(x))),
    random,
  ).sort((a, b) => (lastSeen.get(key(a)) ?? 0) - (lastSeen.get(key(b)) ?? 0));
  return [...fresh, ...stale].slice(0, n);
}

function build(
  type: QuestionType,
  count: number,
  random: RandomInt,
  seen: readonly string[],
): ExamQuestion[] {
  const take = <T extends { id: string }>(list: readonly T[], n = count) =>
    pickFresh(list, n, (x) => `${type}:${x.id}`, seen, random);
  const takeWords = (list: readonly VocabWord[]) =>
    pickFresh(list, count, (w) => `${type}:${w.w}`, seen, random);
  switch (type) {
    case 'yomi':
      return takeWords(VOCAB).map((w) => yomi(w, random));
    case 'hyouki':
      return takeWords(SPELLABLE).map((w) => hyouki(w, random));
    case 'bunmyaku':
      return take(CONTEXT_ITEMS).map((i) =>
        fromChoices(`bunmyaku:${i.id}`, type, i.ja, i.choices, i.explanation, random),
      );
    case 'iikae':
      return take(PARAPHRASE_ITEMS).map((i) =>
        fromChoices(`iikae:${i.id}`, type, `[[${i.ja}]]`, i.choices, i.explanation, random),
      );
    case 'bunpou': {
      // Un tiers de formes grammaticales écrites à la main, le reste en particules générées.
      const fixed = Math.max(1, Math.round(count / 3));
      const grammar = take(GRAMMAR_ITEMS, fixed).map((i) =>
        fromChoices(`bunpou:${i.id}`, type, i.ja, i.choices, i.explanation, random),
      );
      const particles = pickFresh(
        PARTICLE_TEMPLATES,
        count - fixed,
        (t) => `bunpou:part:${t.id}`,
        seen,
        random,
      ).map((t) => {
        const ex = particleExercise(t, random);
        const options = ex.choices ?? [];
        return {
          id: `bunpou:part:${t.id}`,
          type,
          prompt: ex.question,
          options,
          answer: options.findIndex((o) => ex.answers.includes(o)),
          explanation: `${ex.solution} — ${ex.explanation}`,
        } satisfies ExamQuestion;
      });
      return shuffle([...grammar, ...particles], random);
    }
    case 'kumitate':
      return pickFresh(
        KUMITATE_PHRASES.map((_, i) => i),
        count,
        (i) => `kumitate:${KUMITATE_PHRASES[i].id}`,
        seen,
        random,
      ).map((i) => kumitate(i, random));
    case 'dokkai':
      return take(READING_ITEMS).map((i) =>
        fromChoices(`dokkai:${i.id}`, type, i.question, i.choices, i.explanation, random, {
          passage: i.text,
          note: i.questionFr,
        }),
      );
    case 'kadai':
      return take(DIALOGUES).map((d) =>
        fromChoices(`kadai:${d.id}`, type, '', d.choices, d.explanation, random, {
          situation: `${d.situation} ${d.question}`,
          audio: dialogueLines(d),
        }),
      );
    case 'sokuji':
      return take(REPLIES).map((r) => {
        const q = fromChoices(`sokuji:${r.id}`, type, '', r.choices, r.explanation, random, {
          hiddenOptions: true,
        });
        return { ...q, audio: replyLines(r, q.options) };
      });
  }
}

/**
 * Compose un examen. `seen` (questions déjà posées, de la plus ancienne à la plus récente) fait
 * passer en priorité les questions jamais vues : trois examens d'affilée ne se répètent pas.
 */
export function buildExam(
  format: ExamFormat,
  random: RandomInt,
  seen: readonly string[] = [],
): ExamSection[] {
  const plan = PLANS[format];
  return (Object.keys(plan) as SectionId[]).map((id) => ({
    id,
    ...SECTION_TITLES[id],
    minutes: plan[id].minutes,
    questions: (Object.entries(plan[id].counts) as [QuestionType, number][]).flatMap(
      ([type, count]) => build(type, count, random, seen),
    ),
  }));
}

/* ---------- Notation ---------- */

/** Barème du N5 : 120 points pour les connaissances + lecture, 60 pour l'écoute. */
export const N5_SCALE = {
  language: { max: 120, min: 38 },
  listening: { max: 60, min: 19 },
  pass: 80,
  max: 180,
} as const;

export interface PartScore {
  readonly correct: number;
  readonly total: number;
  /** Points ramenés au barème officiel. */
  readonly points: number;
  readonly max: number;
  readonly min: number;
}

export interface ExamResult {
  readonly language: PartScore;
  readonly listening: PartScore;
  readonly total: number;
  readonly passed: boolean;
  /** Raisons de l'échec (seuil global ou minimum d'une partie). */
  readonly reasons: readonly string[];
  readonly byType: readonly { type: QuestionType; correct: number; total: number }[];
}

/** `answers[s][q]` : index choisi pour la question q de la section s (null : sans réponse). */
export function scoreExam(
  sections: readonly ExamSection[],
  answers: readonly (readonly (number | null)[])[],
): ExamResult {
  const tally = (ids: readonly SectionId[]) => {
    let correct = 0;
    let total = 0;
    sections.forEach((s, si) => {
      if (ids.includes(s.id)) {
        s.questions.forEach((q, qi) => {
          total++;
          correct += answers[si]?.[qi] === q.answer ? 1 : 0;
        });
      }
    });
    return { correct, total };
  };
  const part = (
    ids: readonly SectionId[],
    scale: { readonly max: number; readonly min: number },
  ): PartScore => {
    const { correct, total } = tally(ids);
    return {
      correct,
      total,
      points: total ? Math.round((scale.max * correct) / total) : 0,
      max: scale.max,
      min: scale.min,
    };
  };
  const language = part(['moji', 'bunpou'], N5_SCALE.language);
  const listening = part(['choukai'], N5_SCALE.listening);
  const total = language.points + listening.points;
  const reasons: string[] = [];
  if (total < N5_SCALE.pass) {
    reasons.push(`Total sous le seuil de réussite (${N5_SCALE.pass} / ${N5_SCALE.max}).`);
  }
  if (language.points < language.min) {
    reasons.push(`Connaissances et lecture sous le minimum (${language.min} / ${language.max}).`);
  }
  if (listening.points < listening.min) {
    reasons.push(`Écoute sous le minimum (${listening.min} / ${listening.max}).`);
  }
  const types = new Map<QuestionType, { correct: number; total: number }>();
  sections.forEach((s, si) =>
    s.questions.forEach((q, qi) => {
      const t = types.get(q.type) ?? { correct: 0, total: 0 };
      types.set(q.type, {
        correct: t.correct + (answers[si]?.[qi] === q.answer ? 1 : 0),
        total: t.total + 1,
      });
    }),
  );
  return {
    language,
    listening,
    total,
    passed: reasons.length === 0,
    reasons,
    byType: [...types].map(([type, t]) => ({ type, ...t })),
  };
}

/** Découpe un texte en morceaux soulignés ou non (`[[…]]`). */
export function markParts(text: string): { text: string; mark: boolean }[] {
  return text
    .split(/(\[\[[^\]]+]])/)
    .filter(Boolean)
    .map((t) =>
      t.startsWith('[[') ? { text: t.slice(2, -2), mark: true } : { text: t, mark: false },
    );
}
