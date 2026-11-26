/**
 * Reconnaissance d'un kana dessiné à la main.
 *
 * Algorithme « $P » (Vatavu, Anthony & Wobbrock, 2012) : le dessin et chaque modèle sont
 * ré-échantillonnés en un nuage de N points, normalisés (taille, position), puis appariés
 * point à point. L'ordre et le sens des traits n'influencent pas le résultat, ce qui pardonne
 * les tracés approximatifs ; un écart de nombre de traits pénalise légèrement le score.
 *
 * Les modèles viennent des tracés KanjiVG (`data/kana-strokes.ts`).
 */

export interface Point {
  readonly x: number;
  readonly y: number;
}

export type Stroke = readonly Point[];

interface CloudPoint extends Point {
  readonly stroke: number;
}

export interface Template {
  readonly kana: string;
  readonly strokeCount: number;
  readonly cloud: readonly CloudPoint[];
}

export interface Match {
  readonly kana: string;
  /** Ressemblance de 0 à 100. */
  readonly score: number;
}

const CLOUD_SIZE = 64;
/**
 * Échelle de la ressemblance : score = exp(−(d / SCALE)²). Un tracé soigné (d ≈ 0,05) donne
 * ≈ 90 %, un kana voisin (d ≈ 0,1) ≈ 60 %, une forme sans rapport (d > 0,3) ≈ 0 %.
 */
const SCALE = 0.14;
/** Au-delà, le score arrondi vaut 0 : inutile de finir l'appariement. */
const ZERO_SCORE_DISTANCE = SCALE * 2.4;

/* ---------- Lecture des chemins SVG (M, L, H, V, C, S, Q, T, Z, absolus et relatifs) ---------- */

/** Transforme un attribut `d` SVG en polyligne (les courbes sont découpées en segments). */
export function pathToPoints(d: string, segments = 8): Point[] {
  const tokens = d.match(/[a-zA-Z]|-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/g) ?? [];
  const points: Point[] = [];
  let i = 0;
  let cmd = '';
  let x = 0;
  let y = 0;
  let startX = 0;
  let startY = 0;
  let ctrlX = 0;
  let ctrlY = 0;
  let prevCmd = '';
  const num = () => parseFloat(tokens[i++]);

  const cubic = (x1: number, y1: number, x2: number, y2: number, ex: number, ey: number) => {
    for (let s = 1; s <= segments; s++) {
      const t = s / segments;
      const u = 1 - t;
      points.push({
        x: u * u * u * x + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * ex,
        y: u * u * u * y + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * ey,
      });
    }
    ctrlX = x2;
    ctrlY = y2;
    x = ex;
    y = ey;
  };

  while (i < tokens.length) {
    if (/[a-zA-Z]/.test(tokens[i])) {
      cmd = tokens[i++];
    }
    const rel = cmd === cmd.toLowerCase();
    const ox = rel ? x : 0;
    const oy = rel ? y : 0;
    switch (cmd.toUpperCase()) {
      case 'M':
        x = ox + num();
        y = oy + num();
        startX = x;
        startY = y;
        points.push({ x, y });
        cmd = rel ? 'l' : 'L'; // les paires suivantes sont des lignes
        break;
      case 'L':
        x = ox + num();
        y = oy + num();
        points.push({ x, y });
        break;
      case 'H':
        x = ox + num();
        points.push({ x, y });
        break;
      case 'V':
        y = oy + num();
        points.push({ x, y });
        break;
      case 'C': {
        const x1 = ox + num();
        const y1 = oy + num();
        const x2 = ox + num();
        const y2 = oy + num();
        cubic(x1, y1, x2, y2, ox + num(), oy + num());
        break;
      }
      case 'S': {
        const smooth = 'CcSs'.includes(prevCmd);
        const x1 = smooth ? 2 * x - ctrlX : x;
        const y1 = smooth ? 2 * y - ctrlY : y;
        const x2 = ox + num();
        const y2 = oy + num();
        cubic(x1, y1, x2, y2, ox + num(), oy + num());
        break;
      }
      case 'Q': {
        const qx = ox + num();
        const qy = oy + num();
        const ex = ox + num();
        const ey = oy + num();
        cubic(
          x + (2 / 3) * (qx - x),
          y + (2 / 3) * (qy - y),
          ex + (2 / 3) * (qx - ex),
          ey + (2 / 3) * (qy - ey),
          ex,
          ey,
        );
        break;
      }
      case 'Z':
        x = startX;
        y = startY;
        points.push({ x, y });
        break;
      default:
        i++; // commande non gérée : on l'ignore
    }
    prevCmd = cmd;
  }
  return points;
}

/* ---------- Nuage de points ---------- */

function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function pathLength(strokes: readonly Stroke[]): number {
  let length = 0;
  for (const stroke of strokes) {
    for (let i = 1; i < stroke.length; i++) {
      length += distance(stroke[i - 1], stroke[i]);
    }
  }
  return length;
}

/** Ré-échantillonne l'ensemble des traits en `n` points régulièrement espacés. */
function resample(strokes: readonly Stroke[], n: number): CloudPoint[] {
  const usable = strokes.filter((s) => s.length > 0);
  const total = pathLength(usable);
  const out: CloudPoint[] = [];
  if (total === 0) {
    // Que des points isolés (tapotements) : on les répète.
    const dots = usable.flatMap((s, stroke) => s.map((p) => ({ ...p, stroke })));
    for (let k = 0; dots.length && k < n; k++) {
      out.push(dots[k % dots.length]);
    }
    return out;
  }
  const step = total / (n - 1);
  let acc = 0;
  usable.forEach((stroke, strokeIndex) => {
    if (out.length === 0) {
      out.push({ ...stroke[0], stroke: strokeIndex });
    }
    for (let i = 1; i < stroke.length; i++) {
      let prev: Point = stroke[i - 1];
      const cur = stroke[i];
      let d = distance(prev, cur);
      while (acc + d >= step && d > 0) {
        const t = (step - acc) / d;
        const q = { x: prev.x + t * (cur.x - prev.x), y: prev.y + t * (cur.y - prev.y) };
        out.push({ ...q, stroke: strokeIndex });
        prev = q;
        d = distance(prev, cur);
        acc = 0;
      }
      acc += d;
    }
  });
  const last = usable.at(-1)!;
  while (out.length < n) {
    out.push({ ...last[last.length - 1], stroke: usable.length - 1 });
  }
  return out.slice(0, n);
}

/** Met le nuage à l'échelle (plus grande dimension = 1) et le centre sur son barycentre. */
function normalize(points: readonly CloudPoint[]): CloudPoint[] {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const size = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) || 1;
  const cx = xs.reduce((a, b) => a + b, 0) / points.length;
  const cy = ys.reduce((a, b) => a + b, 0) / points.length;
  return points.map((p) => ({ x: (p.x - cx) / size, y: (p.y - cy) / size, stroke: p.stroke }));
}

export function toCloud(strokes: readonly Stroke[]): CloudPoint[] {
  return normalize(resample(strokes, CLOUD_SIZE));
}

/** Somme pondérée des appariements ; s'arrête dès que `limit` est dépassée (abandon anticipé). */
function cloudDistance(
  a: readonly CloudPoint[],
  b: readonly CloudPoint[],
  start: number,
  limit: number,
): number {
  const n = a.length;
  const matched = new Uint8Array(n);
  let sum = 0;
  let i = start;
  let weight = n;
  do {
    let min = Infinity;
    let index = -1;
    const p = a[i];
    for (let j = 0; j < n; j++) {
      if (!matched[j]) {
        const dx = p.x - b[j].x;
        const dy = p.y - b[j].y;
        const d = dx * dx + dy * dy;
        if (d < min) {
          min = d;
          index = j;
        }
      }
    }
    matched[index] = 1;
    sum += (weight / n) * Math.sqrt(min);
    if (sum >= limit) {
      return sum;
    }
    weight--;
    i = (i + 1) % n;
  } while (i !== start);
  return sum;
}

/** Distance moyenne entre deux nuages (0 = identiques), plafonnée à `cap`. */
export function greedyMatch(
  a: readonly CloudPoint[],
  b: readonly CloudPoint[],
  cap = Infinity,
): number {
  const n = a.length;
  const norm = (n + 1) / 2; // les poids totalisent (n + 1) / 2
  const step = Math.max(1, Math.floor(Math.sqrt(n)));
  let min = cap * norm;
  for (let i = 0; i < n; i += step) {
    min = Math.min(min, cloudDistance(a, b, i, min), cloudDistance(b, a, i, min));
  }
  return min / norm;
}

export function buildTemplates(strokes: Readonly<Record<string, readonly string[]>>): Template[] {
  return Object.entries(strokes).map(([kana, paths]) => ({
    kana,
    strokeCount: paths.length,
    cloud: toCloud(paths.map((d) => pathToPoints(d))),
  }));
}

/** Ressemblance 0–100 entre un dessin et un modèle. */
export function similarity(
  cloud: readonly CloudPoint[],
  strokeCount: number,
  template: Template,
): number {
  const strokePenalty = 1 + 0.06 * Math.abs(strokeCount - template.strokeCount);
  const d = greedyMatch(cloud, template.cloud, ZERO_SCORE_DISTANCE / strokePenalty);
  const scaled = (d * strokePenalty) / SCALE;
  return Math.round(100 * Math.exp(-scaled * scaled));
}

/** Les `limit` modèles les plus proches du dessin, du plus ressemblant au moins ressemblant. */
export function recognize(
  strokes: readonly Stroke[],
  templates: readonly Template[],
  limit = 5,
): Match[] {
  const usable = strokes.filter((s) => s.length > 0);
  if (!usable.length) {
    return [];
  }
  const cloud = toCloud(usable);
  return templates
    .map((t) => ({ kana: t.kana, score: similarity(cloud, usable.length, t) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
