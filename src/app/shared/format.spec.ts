import { formatDecimal, pad2, parseDecimal } from './format';

describe('parseDecimal', () => {
  it('accepte la virgule et le point', () => {
    expect(parseDecimal('2,54')).toBe(2.54);
    expect(parseDecimal('2.54')).toBe(2.54);
  });

  it('ignore les espaces, y compris insécables', () => {
    expect(parseDecimal('1 609,3')).toBe(1609.3);
    expect(parseDecimal('1 609')).toBe(1609);
  });

  it('renvoie NaN pour une saisie vide ou invalide', () => {
    expect(parseDecimal('')).toBeNaN();
    expect(parseDecimal('abc')).toBeNaN();
    expect(parseDecimal('1,2,3')).toBeNaN();
  });
});

describe('formatDecimal', () => {
  it('utilise la virgule décimale', () => {
    expect(formatDecimal(30.48)).toBe('30,48');
  });

  it('arrondit et évite « -0 »', () => {
    expect(formatDecimal(1 / 3)).toBe('0,333');
    expect(formatDecimal(-0.00001)).toBe('0');
  });

  it('renvoie une chaîne vide pour NaN', () => {
    expect(formatDecimal(Number.NaN)).toBe('');
  });
});

describe('pad2', () => {
  it('complète à deux chiffres', () => {
    expect(pad2(7)).toBe('07');
    expect(pad2(12)).toBe('12');
  });
});
