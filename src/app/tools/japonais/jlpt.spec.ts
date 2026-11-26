import { CONTEXT_ITEMS, GRAMMAR_ITEMS, PARAPHRASE_ITEMS, READING_ITEMS } from './data/jlpt';
import { buildExam, markParts, misspellings, pickFresh, PLANS, scoreExam } from './jlpt';
import { beyondLevel } from './phrases';

const seeded = (seed = 11) => {
  let s = seed;
  return (max: number) => {
    s = (s * 1103515245 + 12345) % 2 ** 31;
    return s % max;
  };
};

describe('examen blanc JLPT N5', () => {
  it('compose les trois épreuves selon le plan, sans doublon', () => {
    for (const format of ['complet', 'court'] as const) {
      const exam = buildExam(format, seeded());
      expect(exam.map((s) => s.id)).toEqual(['moji', 'bunpou', 'choukai']);
      exam.forEach((section) => {
        const plan = PLANS[format][section.id];
        const expected = Object.values(plan.counts).reduce((a, b) => a + b, 0);
        expect(section.questions, `${format} ${section.id}`).toHaveLength(expected);
        expect(section.minutes).toBe(plan.minutes);
        expect(new Set(section.questions.map((q) => q.id)).size).toBe(expected);
      });
    }
  });

  it('trois examens complets d’affilée ne partagent aucune question', () => {
    const random = seeded(5);
    let seen: string[] = [];
    const all: string[] = [];
    for (let i = 0; i < 3; i++) {
      const ids = buildExam('complet', random, seen).flatMap((s) => s.questions.map((q) => q.id));
      all.push(...ids);
      seen = [...seen, ...ids];
    }
    const repeated = all.filter((id, i) => all.indexOf(id) !== i);
    expect(repeated).toEqual([]);
  });

  it('une fois tout vu, reprend d’abord les questions les plus anciennes', () => {
    const items = ['a', 'b', 'c', 'd'];
    expect(pickFresh(items, 2, (x) => x, ['c', 'a', 'b'], seeded())).toEqual(['d', 'c']);
  });

  it('respecte les durées officielles du N5', () => {
    const minutes = Object.values(PLANS.complet).map((p) => p.minutes);
    expect(minutes).toEqual([20, 40, 30]);
  });

  it('chaque question a des propositions distinctes et une bonne réponse', () => {
    for (let seed = 1; seed < 15; seed++) {
      for (const section of buildExam('complet', seeded(seed))) {
        for (const q of section.questions) {
          expect(q.options.length, q.id).toBeGreaterThanOrEqual(3);
          expect(new Set(q.options).size, `${q.id} ${q.options.join(',')}`).toBe(q.options.length);
          expect(q.answer, q.id).toBeGreaterThanOrEqual(0);
          expect(q.answer).toBeLessThan(q.options.length);
        }
      }
    }
  });

  it('propose des fautes d’écriture plausibles', () => {
    expect(misspellings('先生')).toEqual(expect.arrayContaining(['生生', '先先']));
    expect(misspellings('右')).toEqual(['左']);
  });

  it('note selon le barème du N5 : 120 + 60 points, seuil 80 et minimums', () => {
    const exam = buildExam('court', seeded());
    const perfect = exam.map((s) => s.questions.map((q) => q.answer));
    const best = scoreExam(exam, perfect);
    expect(best.total).toBe(180);
    expect(best.passed).toBe(true);

    const empty = exam.map((s) => s.questions.map(() => null));
    const worst = scoreExam(exam, empty);
    expect(worst.total).toBe(0);
    expect(worst.passed).toBe(false);
    expect(worst.reasons).toHaveLength(3);

    // Langue parfaite mais écoute nulle : 120 points, au-dessus de 80, mais minimum d'écoute raté.
    const noListening = exam.map((s) =>
      s.questions.map((q) => (s.id === 'choukai' ? null : q.answer)),
    );
    const r = scoreExam(exam, noListening);
    expect(r.total).toBe(120);
    expect(r.passed).toBe(false);
    expect(r.reasons[0]).toContain('Écoute');
  });

  it('les questions écrites à la main restent au niveau N5', () => {
    for (const i of [...CONTEXT_ITEMS, ...GRAMMAR_ITEMS, ...PARAPHRASE_ITEMS]) {
      for (const t of [i.ja, ...i.choices]) {
        expect(beyondLevel(t), `${i.id} : ${t}`).toBe(false);
      }
    }
    for (const i of READING_ITEMS) {
      for (const t of [i.text, i.question, ...i.choices]) {
        expect(beyondLevel(t), `${i.id} : ${t}`).toBe(false);
      }
    }
  });

  it('repère la partie soulignée', () => {
    expect(markParts('あの [[先生]] は')).toEqual([
      { text: 'あの ', mark: false },
      { text: '先生', mark: true },
      { text: ' は', mark: false },
    ]);
  });
});
