import { PARTICLE_TEMPLATES, SLOTS, VERBS } from './data/grammar';
import { VOCAB } from './data/vocab';
import {
  checkExercise,
  conjugate,
  counterExercise,
  dayReading,
  diagnose,
  EXERCISE_KINDS,
  explainReading,
  generateExercise,
  hourReading,
  makeSheet,
  minuteReading,
  numberReading,
  particleExercise,
  readingDistractors,
} from './exercises';
import { beyondLevel } from './phrases';

/** Générateur pseudo-aléatoire déterministe. */
function seeded(seed = 42) {
  let state = seed;
  return (max: number) => {
    state = (state * 1103515245 + 12345) % 2 ** 31;
    return state % max;
  };
}

const verb = (r: string) => VERBS.find((v) => v.r === r)!;

describe('conjugaison', () => {
  it('conjugue les verbes du groupe 2', () => {
    expect(conjugate(verb('たべる'), 'masu')).toEqual({ kana: 'たべます', written: '食べます' });
    expect(conjugate(verb('みる'), 'te').written).toBe('見て');
    expect(conjugate(verb('ねる'), 'nai').kana).toBe('ねない');
  });

  it('conjugue les verbes du groupe 1, forme en て comprise', () => {
    expect(conjugate(verb('かく'), 'te').written).toBe('書いて');
    expect(conjugate(verb('およぐ'), 'ta').kana).toBe('およいだ');
    expect(conjugate(verb('のむ'), 'te').written).toBe('飲んで');
    expect(conjugate(verb('あそぶ'), 'ta').kana).toBe('あそんだ');
    expect(conjugate(verb('はなす'), 'te').written).toBe('話して');
    expect(conjugate(verb('まつ'), 'ta').kana).toBe('まった');
    expect(conjugate(verb('かう'), 'nai').written).toBe('買わない');
    expect(conjugate(verb('かえる'), 'masu').kana).toBe('かえります');
    expect(conjugate(verb('よむ'), 'mashita').written).toBe('読みました');
  });

  it('connaît les exceptions', () => {
    expect(conjugate(verb('いく'), 'te').written).toBe('行って');
    expect(conjugate(verb('ある'), 'nai').kana).toBe('ない');
    expect(conjugate(verb('くる'), 'nai')).toEqual({ kana: 'こない', written: '来ない' });
    expect(conjugate(verb('くる'), 'masu')).toEqual({ kana: 'きます', written: '来ます' });
    expect(conjugate(verb('べんきょうする'), 'ta').kana).toBe('べんきょうした');
  });

  it('les verbes sont écrits avec des kanji du N5 seulement', () => {
    for (const v of VERBS) {
      expect(beyondLevel(v.w), v.w).toBe(false);
    }
  });
});

describe('nombres et compteurs', () => {
  it('lit les nombres avec leurs changements de son', () => {
    expect(numberReading(300)).toBe('さんびゃく');
    expect(numberReading(600)).toBe('ろっぴゃく');
    expect(numberReading(8000)).toBe('はっせん');
    expect(numberReading(3800)).toBe('さんぜんはっぴゃく');
    expect(numberReading(1111)).toBe('せんひゃくじゅういち');
    expect(numberReading(24)).toBe('にじゅうよん');
    expect(numberReading(10000)).toBe('いちまん');
  });

  it('lit les heures, les minutes et les jours', () => {
    expect(hourReading(4)).toEqual(['よじ']);
    expect(hourReading(9)).toEqual(['くじ']);
    expect(hourReading(11)).toEqual(['じゅういちじ']);
    expect(minuteReading(3)).toEqual(['さんぷん']);
    expect(minuteReading(20)[0]).toBe('にじゅっぷん');
    expect(minuteReading(15)).toEqual(['じゅうごふん']);
    expect(dayReading(1)).toBe('ついたち');
    expect(dayReading(20)).toBe('はつか');
    expect(dayReading(17)).toBe('じゅうしちにち');
  });

  it('reconnaît la lecture sans changement de son comme un piège', () => {
    const ex = counterExercise('hon', 3);
    expect(checkExercise(ex, 'sanbon')).toBe(true);
    expect(checkExercise(ex, 'さんぼん')).toBe(true);
    expect(checkExercise(ex, 'sanhon')).toBe(false);
    expect(diagnose(ex, 'sanhon')).toContain('changement de son');
  });
});

describe('particules', () => {
  it('chaque modèle a ses cases et ses intrus ne sont jamais des réponses', () => {
    const random = seeded();
    for (const template of PARTICLE_TEMPLATES) {
      for (const slot of template.ja.match(/\{(\w+)\}/g) ?? []) {
        expect(SLOTS[slot.slice(1, -1)], `${template.id} ${slot}`).toBeDefined();
      }
      for (let i = 0; i < 5; i++) {
        const ex = particleExercise(template, random);
        expect(ex.choices).toHaveLength(4);
        expect(ex.choices).toContain(template.answers[0]);
        const wrong = ex.choices!.filter((c) => !template.answers.includes(c));
        expect(
          wrong.some((c) => ['は', 'も'].includes(c)),
          template.id,
        ).toBe(false);
        expect(ex.question).toContain('（　）');
        expect(ex.hint).not.toContain('{');
      }
    }
  });

  it('explique les erreurs classiques', () => {
    const aimer = particleExercise(
      PARTICLE_TEMPLATES.find((t) => t.id === 'aimer')!,
      seeded(),
    );
    expect(checkExercise(aimer, 'が')).toBe(true);
    expect(checkExercise(aimer, 'を')).toBe(false);
    expect(aimer.choices).toContain('を');
    expect(diagnose(aimer, 'を')).toContain('すき');
  });

  it('accepte へ et に pour une destination', () => {
    const ex = particleExercise(
      PARTICLE_TEMPLATES.find((t) => t.id === 'destination')!,
      seeded(),
    );
    expect(checkExercise(ex, 'へ')).toBe(true);
    expect(checkExercise(ex, 'に')).toBe(true);
  });

  it('les phrases ne contiennent que des kanji du N5', () => {
    for (const t of PARTICLE_TEMPLATES) {
      expect(beyondLevel(t.ja), t.id).toBe(false);
    }
    for (const options of Object.values(SLOTS)) {
      for (const o of options) {
        expect(beyondLevel(o.ja), o.ja).toBe(false);
      }
    }
  });
});

describe('lecture de kanji', () => {
  it('le vocabulaire ne contient que des kanji du N5', () => {
    for (const w of VOCAB) {
      expect(beyondLevel(w.w), w.w).toBe(false);
    }
  });

  it('explique la lecture kanji par kanji', () => {
    const gakkou = VOCAB.find((w) => w.w === '学校')!;
    expect(explainReading(gakkou)).toContain('学 → がっ (on)');
    const yama = VOCAB.find((w) => w.w === '山')!;
    expect(explainReading(yama)).toContain('山 → やま (kun)');
  });

  it('propose des lectures proches et distinctes', () => {
    const options = readingDistractors('がっこう', ['せんせい', 'でんしゃ'], seeded());
    expect(options).toHaveLength(4);
    expect(new Set(options).size).toBe(4);
    expect(options).toContain('がっこう');
  });
});

describe('fiches', () => {
  it('produit des exercices différents, de tous les types demandés', () => {
    const sheet = makeSheet(['conjugaison', 'nombres'], 10, seeded());
    expect(sheet).toHaveLength(10);
    expect(new Set(sheet.map((e) => e.key)).size).toBe(10);
    expect(new Set(sheet.map((e) => e.kind))).toEqual(new Set(['conjugaison', 'nombres']));
  });

  it('chaque exercice généré accepte sa propre solution', () => {
    const random = seeded(7);
    for (const { id } of EXERCISE_KINDS) {
      for (let i = 0; i < 40; i++) {
        const ex = generateExercise(id, random);
        expect(checkExercise(ex, ex.answers[0]), ex.key).toBe(true);
        expect(ex.explanation.length).toBeGreaterThan(10);
      }
    }
  });
});
