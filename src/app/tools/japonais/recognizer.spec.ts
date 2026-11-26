import { KANA_STROKES } from './data/kana-strokes';
import { KANJI_STROKES } from './data/kanji-strokes';
import { buildTemplates, pathToPoints, Point, recognize, Stroke } from './recognizer';

/** Générateur pseudo-aléatoire déterministe (mulberry32). */
function seeded(seed: number): () => number {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const templates = buildTemplates(KANA_STROKES);
const strokesOf = (kana: string): Stroke[] => KANA_STROKES[kana].map((d) => pathToPoints(d));

/** Imite un tracé humain : déformation, décalage, tremblement et traits dans le désordre. */
function scribble(strokes: Stroke[], random: () => number): Stroke[] {
  const sx = 2 + random() * 1.2;
  const sy = sx * (0.85 + random() * 0.3);
  const shear = (random() - 0.5) * 0.2;
  const dx = random() * 60;
  const dy = random() * 60;
  const out = strokes.map((stroke) =>
    stroke.map((p): Point => ({
      x: (p.x + shear * p.y) * sx + dx + (random() - 0.5) * 6,
      y: p.y * sy + dy + (random() - 0.5) * 6,
    })),
  );
  return random() < 0.5 ? out.reverse() : out;
}

describe('pathToPoints', () => {
  it('suit les commandes absolues et relatives', () => {
    expect(pathToPoints('M10,10 L20,10 l0,10 H0 V0 Z')).toEqual([
      { x: 10, y: 10 },
      { x: 20, y: 10 },
      { x: 20, y: 20 },
      { x: 0, y: 20 },
      { x: 0, y: 0 },
      { x: 10, y: 10 },
    ]);
  });

  it('termine une courbe de Bézier sur son point d’arrivée', () => {
    const points = pathToPoints('M0,0c10,0,20,10,20,20s10,20,20,20', 4);
    expect(points).toHaveLength(9);
    expect(points[4]).toEqual({ x: 20, y: 20 });
    expect(points[8]).toEqual({ x: 40, y: 40 });
  });
});

describe('recognize', () => {
  it('a un modèle pour chacun des 142 kana', () => {
    expect(templates).toHaveLength(142);
    expect(templates.find((t) => t.kana === 'め')?.strokeCount).toBe(2);
  });

  it('reconnaît un modèle tracé à l’identique avec 100 %', () => {
    const [best] = recognize(strokesOf('め'), templates);
    expect(best).toEqual({ kana: 'め', score: 100 });
  });

  it(
    'retrouve les kana tracés à la main dans ses 3 premières propositions',
    { timeout: 20_000 },
    () => {
      const random = seeded(42);
      const kana = Object.keys(KANA_STROKES);
      const found = kana.filter((k) =>
        recognize(scribble(strokesOf(k), random), templates, 3).some((m) => m.kana === k),
      );
      expect(found.length / kana.length).toBeGreaterThan(0.95);
    },
  );

  it(
    'retrouve aussi les kanji N5/N4 parmi kana et kanji, dans ses 5 premières propositions',
    { timeout: 30_000 },
    () => {
      const all = buildTemplates({ ...KANA_STROKES, ...KANJI_STROKES });
      const random = seeded(7);
      const kanji = Object.keys(KANJI_STROKES).filter((_, i) => i % 4 === 0); // échantillon : 71 kanji
      const found = kanji.filter((k) =>
        recognize(
          scribble(
            KANJI_STROKES[k].map((d) => pathToPoints(d)),
            random,
          ),
          all,
          5,
        ).some((m) => m.kana === k),
      );
      expect(found.length / kanji.length).toBeGreaterThan(0.85);
    },
  );

  it('classe les propositions de la plus à la moins ressemblante', () => {
    const matches = recognize(strokesOf('ぬ'), templates);
    expect(matches).toHaveLength(5);
    expect(matches.map((m) => m.score)).toEqual(
      [...matches.map((m) => m.score)].sort((a, b) => b - a),
    );
  });

  it('ne propose rien pour un dessin vide', () => {
    expect(recognize([], templates)).toEqual([]);
    expect(recognize([[]], templates)).toEqual([]);
  });
});
