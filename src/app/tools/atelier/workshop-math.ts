import { parseDecimal } from '../../shared/format';

// ---------------------------------------------------------------- Angle d'onglet

/** Réglage de la scie à onglet (0° = coupe droite) pour un cadre régulier à n côtés. */
export const miterAngle = (sides: number): number => 180 / sides;
/** Angle intérieur du polygone formé par le cadre. */
export const interiorAngle = (sides: number): number => 180 - 360 / sides;

export interface FramePieces {
  /** Longueur de chaque montant, pointe longue à pointe longue (cm). */
  readonly long: number;
  readonly short: number;
  /** Longueur de baguette à acheter, chutes d'onglet comprises (cm). */
  readonly total: number;
}

/** Cadre rectangulaire : dimensions intérieures (feuillure ignorée) et largeur de baguette. */
export function rectangleFrame(
  innerWidth: number,
  innerHeight: number,
  moldingWidth: number,
): FramePieces {
  const long = Math.max(innerWidth, innerHeight) + 2 * moldingWidth;
  const short = Math.min(innerWidth, innerHeight) + 2 * moldingWidth;
  // Chaque coupe d'onglet perd environ une largeur de baguette entre deux pièces.
  return { long, short, total: 2 * long + 2 * short + 4 * moldingWidth };
}

// ---------------------------------------------------------------- Débit de planches

export interface CutRequest {
  readonly length: number;
  readonly qty: number;
}

export interface BoardPlan {
  readonly cuts: readonly number[];
  readonly used: number;
  readonly waste: number;
}

export interface CutPlan {
  readonly boards: readonly BoardPlan[];
  /** Pièces plus longues que la planche : impossibles à débiter. */
  readonly tooLong: readonly number[];
}

/** Lignes « 800 x 4 », « 800×4 », « 800 » (quantité 1). Les lignes invalides sont ignorées. */
export function parseCutList(text: string): CutRequest[] {
  return text
    .split('\n')
    .map((line) => /^\s*([\d.,]+)\s*(?:[x×*]\s*(\d+))?\s*$/i.exec(line))
    .filter((m): m is RegExpExecArray => m !== null)
    .map((m) => ({ length: parseDecimal(m[1]), qty: m[2] ? Number(m[2]) : 1 }))
    .filter((r) => r.length > 0 && r.qty > 0);
}

/**
 * Plus grand d'abord, première planche où ça rentre (First Fit Decreasing).
 * Le trait de scie est compté entre deux coupes d'une même planche.
 */
export function planCuts(
  stockLength: number,
  kerf: number,
  requests: readonly CutRequest[],
): CutPlan {
  const pieces = requests.flatMap((r) => Array<number>(r.qty).fill(r.length)).sort((a, b) => b - a);
  const tooLong = pieces.filter((p) => p > stockLength);
  const boards: { cuts: number[]; used: number }[] = [];
  for (const piece of pieces.filter((p) => p <= stockLength)) {
    const board = boards.find((b) => b.used + kerf + piece <= stockLength);
    if (board) {
      board.cuts.push(piece);
      board.used += kerf + piece;
    } else {
      boards.push({ cuts: [piece], used: piece });
    }
  }
  return {
    boards: boards.map((b) => ({ cuts: b.cuts, used: b.used, waste: stockLength - b.used })),
    tooLong,
  };
}

// ---------------------------------------------------------------- Métrage de tissu

export interface FabricPiece {
  readonly width: number;
  readonly height: number;
  readonly qty: number;
}

export interface FabricPlan {
  /** Longueur de tissu nécessaire, sans marge (cm). */
  readonly lengthCm: number;
  readonly rows: number;
  /** Pièces plus larges que la laize, même tournées. */
  readonly unfit: number;
}

/** Lignes « 40 x 60 x 2 » (largeur × hauteur × quantité), quantité 1 par défaut. */
export function parseFabricPieces(text: string): FabricPiece[] {
  return text
    .split('\n')
    .map((line) => /^\s*([\d.,]+)\s*[x×*]\s*([\d.,]+)\s*(?:[x×*]\s*(\d+))?\s*$/i.exec(line))
    .filter((m): m is RegExpExecArray => m !== null)
    .map((m) => ({
      width: parseDecimal(m[1]),
      height: parseDecimal(m[2]),
      qty: m[3] ? Number(m[3]) : 1,
    }))
    .filter((p) => p.width > 0 && p.height > 0 && p.qty > 0);
}

/**
 * Placement en rangées (shelf packing) sur la laize. Les pièces peuvent être tournées
 * (à éviter pour un tissu à sens ou à motif : `allowRotation = false`).
 */
export function fabricLength(
  laize: number,
  pieces: readonly FabricPiece[],
  allowRotation = true,
): FabricPlan {
  let unfit = 0;
  const placed: { w: number; h: number }[] = [];
  for (const piece of pieces) {
    for (let i = 0; i < piece.qty; i += 1) {
      const fitsUpright = piece.width <= laize;
      const fitsRotated = allowRotation && piece.height <= laize;
      if (!fitsUpright && !fitsRotated) {
        unfit += 1;
        continue;
      }
      // Pour économiser la longueur, on met le grand côté dans la largeur quand c'est possible.
      const rotate = fitsRotated && (!fitsUpright || piece.height > piece.width);
      placed.push(
        rotate ? { w: piece.height, h: piece.width } : { w: piece.width, h: piece.height },
      );
    }
  }
  placed.sort((a, b) => b.h - a.h);
  let length = 0;
  let rows = 0;
  let rowWidth = Infinity;
  for (const p of placed) {
    if (rowWidth + p.w > laize) {
      rows += 1;
      length += p.h; // La première pièce d'une rangée est la plus haute (tri décroissant).
      rowWidth = 0;
    }
    rowWidth += p.w;
  }
  return { lengthCm: length, rows, unfit };
}

// ---------------------------------------------------------------- Cyanotype

/** Formule classique : A = 25 g de citrate d'ammonium ferrique (vert) pour 100 ml d'eau ; B = 10 g de ferricyanure de potassium pour 100 ml. Mélange 1:1. */
export const SOLUTION_A_G_PER_100ML = 25;
export const SOLUTION_B_G_PER_100ML = 10;
/** Mélange étalé au pinceau : environ 2 ml par feuille A4. */
export const MIX_ML_PER_A4 = 2;
const A4_CM2 = 21 * 29.7;

export interface CyanotypeMix {
  readonly mixMl: number;
  readonly eachMl: number;
  readonly gramsA: number;
  readonly gramsB: number;
}

export function cyanotypeMix(areaCm2: number): CyanotypeMix {
  const mixMl = (areaCm2 / A4_CM2) * MIX_ML_PER_A4;
  const eachMl = mixMl / 2;
  return {
    mixMl,
    eachMl,
    gramsA: (eachMl * SOLUTION_A_G_PER_100ML) / 100,
    gramsB: (eachMl * SOLUTION_B_G_PER_100ML) / 100,
  };
}

export const EXPOSURES: readonly { id: string; label: string; minutes: number }[] = [
  { id: 'soleil-ete', label: 'Plein soleil, été', minutes: 10 },
  { id: 'soleil-hiver', label: "Soleil d'hiver", minutes: 20 },
  { id: 'voile', label: 'Ciel voilé', minutes: 30 },
  { id: 'couvert', label: 'Ciel couvert', minutes: 45 },
  { id: 'uv', label: 'Lampe UV 365 nm', minutes: 15 },
];

// ---------------------------------------------------------------- Nombre d'or

export const PHI = (1 + Math.sqrt(5)) / 2;

export interface GoldenSplit {
  /** Grand segment : L / φ. */
  readonly major: number;
  /** Petit segment : L − L / φ. */
  readonly minor: number;
  /** L × φ, pour prolonger une mesure. */
  readonly extended: number;
}

export function goldenSplit(length: number): GoldenSplit {
  const major = length / PHI;
  return { major, minor: length - major, extended: length * PHI };
}
