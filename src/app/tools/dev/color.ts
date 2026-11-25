/** Utilitaires couleur partagés par les outils « Couleurs » et « Contraste ». */

export interface Rgb {
  readonly r: number;
  readonly g: number;
  readonly b: number;
}

export interface Hsl {
  /** Teinte, 0 à 360. */
  readonly h: number;
  /** Saturation, 0 à 100. */
  readonly s: number;
  /** Luminosité, 0 à 100. */
  readonly l: number;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** Lit #rgb, #rrggbb, rgb(…) ou hsl(…) (virgules ou espaces). Renvoie null si invalide. */
export function parseColor(raw: string): Rgb | null {
  const text = raw.trim().toLowerCase();

  const hex = /^#?([\da-f]{3}|[\da-f]{6})$/.exec(text);
  if (hex) {
    const digits = hex[1].length === 3 ? [...hex[1]].map((c) => c + c).join('') : hex[1];
    return {
      r: parseInt(digits.slice(0, 2), 16),
      g: parseInt(digits.slice(2, 4), 16),
      b: parseInt(digits.slice(4, 6), 16),
    };
  }

  const fn =
    /^(rgb|hsl)a?\(\s*([\d.]+)(?:deg)?[\s,]+([\d.]+)%?[\s,]+([\d.]+)%?(?:\s*[,/]\s*[\d.]+%?)?\s*\)$/.exec(
      text,
    );
  if (!fn) {
    return null;
  }
  const [a, b, c] = [Number(fn[2]), Number(fn[3]), Number(fn[4])];
  if (fn[1] === 'rgb') {
    if ([a, b, c].some((v) => v > 255)) {
      return null;
    }
    return { r: Math.round(a), g: Math.round(b), b: Math.round(c) };
  }
  if (b > 100 || c > 100) {
    return null;
  }
  return hslToRgb({ h: a % 360, s: b, l: c });
}

export function rgbToHex({ r, g, b }: Rgb): string {
  return (
    '#' +
    [r, g, b]
      .map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase()
  );
}

export function rgbToHsl({ r, g, b }: Rgb): Hsl {
  const [rn, gn, bn] = [r / 255, g / 255, b / 255];
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) {
    return { h: 0, s: 0, l: Math.round(l * 100) };
  }
  const s = d / (1 - Math.abs(2 * l - 1));
  let h: number;
  if (max === rn) {
    h = ((gn - bn) / d) % 6;
  } else if (max === gn) {
    h = (bn - rn) / d + 2;
  } else {
    h = (rn - gn) / d + 4;
  }
  return { h: Math.round((h * 60 + 360) % 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

export function hslToRgb({ h, s, l }: Hsl): Rgb {
  const sn = s / 100;
  const ln = l / 100;
  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = ln - c / 2;
  const [r, g, b] =
    h < 60
      ? [c, x, 0]
      : h < 120
        ? [x, c, 0]
        : h < 180
          ? [0, c, x]
          : h < 240
            ? [0, x, c]
            : h < 300
              ? [x, 0, c]
              : [c, 0, x];
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

export function formatRgb({ r, g, b }: Rgb): string {
  return `rgb(${r} ${g} ${b})`;
}

export function formatHsl({ h, s, l }: Hsl): string {
  return `hsl(${h} ${s}% ${l}%)`;
}

/** Luminance relative WCAG 2.x. */
export function relativeLuminance({ r, g, b }: Rgb): number {
  const channel = (v: number) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** Ratio de contraste WCAG, de 1 à 21. */
export function contrastRatio(a: Rgb, b: Rgb): number {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

export interface WcagLevels {
  readonly aaNormal: boolean;
  readonly aaLarge: boolean;
  readonly aaaNormal: boolean;
  readonly aaaLarge: boolean;
}

export function wcagLevels(ratio: number): WcagLevels {
  return {
    aaNormal: ratio >= 4.5,
    aaLarge: ratio >= 3,
    aaaNormal: ratio >= 7,
    aaaLarge: ratio >= 4.5,
  };
}

/** Mélange linéaire de deux couleurs (t = 0 → a, t = 1 → b). */
export function mix(a: Rgb, b: Rgb, t: number): Rgb {
  return {
    r: Math.round(a.r + (b.r - a.r) * t),
    g: Math.round(a.g + (b.g - a.g) * t),
    b: Math.round(a.b + (b.b - a.b) * t),
  };
}

/** Teintes (vers le blanc) puis nuances (vers le noir), de la plus claire à la plus foncée. */
export function tintsAndShades(base: Rgb, steps = 4): Rgb[] {
  const white = { r: 255, g: 255, b: 255 };
  const black = { r: 0, g: 0, b: 0 };
  const tints = Array.from({ length: steps }, (_, i) =>
    mix(base, white, (steps - i) / (steps + 1)),
  );
  const shades = Array.from({ length: steps }, (_, i) => mix(base, black, (i + 1) / (steps + 1)));
  return [...tints, base, ...shades];
}
