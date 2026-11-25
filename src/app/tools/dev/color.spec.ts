import {
  contrastRatio,
  formatHsl,
  hslToRgb,
  parseColor,
  rgbToHex,
  rgbToHsl,
  tintsAndShades,
  wcagLevels,
} from './color';

describe('parseColor', () => {
  it('lit les formats hexadécimaux', () => {
    expect(parseColor('#FFD23F')).toEqual({ r: 255, g: 210, b: 63 });
    expect(parseColor('fff')).toEqual({ r: 255, g: 255, b: 255 });
  });

  it('lit rgb() et hsl(), avec virgules ou espaces', () => {
    expect(parseColor('rgb(17, 17, 17)')).toEqual({ r: 17, g: 17, b: 17 });
    expect(parseColor('rgb(255 0 0 / 50%)')).toEqual({ r: 255, g: 0, b: 0 });
    expect(parseColor('hsl(0, 100%, 50%)')).toEqual({ r: 255, g: 0, b: 0 });
  });

  it('refuse les saisies invalides', () => {
    expect(parseColor('#12')).toBeNull();
    expect(parseColor('rgb(300, 0, 0)')).toBeNull();
    expect(parseColor('rouge')).toBeNull();
  });
});

describe('conversions', () => {
  it('rgb ↔ hex ↔ hsl', () => {
    expect(rgbToHex({ r: 255, g: 107, b: 107 })).toBe('#FF6B6B');
    expect(formatHsl(rgbToHsl({ r: 255, g: 0, b: 0 }))).toBe('hsl(0 100% 50%)');
    expect(hslToRgb({ h: 120, s: 100, l: 25 })).toEqual({ r: 0, g: 128, b: 0 });
  });
});

describe('contraste WCAG', () => {
  it('vaut 21 pour noir sur blanc et 1 pour une couleur sur elle-même', () => {
    const black = { r: 0, g: 0, b: 0 };
    const white = { r: 255, g: 255, b: 255 };
    expect(contrastRatio(black, white)).toBeCloseTo(21, 6);
    expect(contrastRatio(white, white)).toBeCloseTo(1, 6);
  });

  it('applique les seuils AA / AAA', () => {
    expect(wcagLevels(4.5)).toEqual({
      aaNormal: true,
      aaLarge: true,
      aaaNormal: false,
      aaaLarge: true,
    });
    expect(wcagLevels(3.2).aaNormal).toBe(false);
  });
});

describe('tintsAndShades', () => {
  it('renvoie la couleur au centre, du plus clair au plus foncé', () => {
    const base = { r: 100, g: 100, b: 100 };
    const palette = tintsAndShades(base, 3);
    expect(palette).toHaveLength(7);
    expect(palette[3]).toEqual(base);
    expect(palette[0].r).toBeGreaterThan(palette[6].r);
  });
});
