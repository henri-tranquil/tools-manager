import { buildPsiRequest, normalizeUrl, parsePsiResponse, psiErrorMessage } from './psi';

describe('normalizeUrl', () => {
  it('ajoute https:// si besoin', () => {
    expect(normalizeUrl('exemple.fr')).toBe('https://exemple.fr/');
    expect(normalizeUrl('  http://exemple.fr/page ')).toBe('http://exemple.fr/page');
  });

  it('refuse les URL non analysables', () => {
    expect(normalizeUrl('')).toBeNull();
    expect(normalizeUrl('localhost:4200')).toBeNull();
    expect(normalizeUrl('ftp://exemple.fr')).toBeNull();
    expect(normalizeUrl('pas une url')).toBeNull();
  });
});

describe('buildPsiRequest', () => {
  it('encode l’URL et la stratégie', () => {
    const request = new URL(buildPsiRequest('https://exemple.fr/?a=1', 'desktop', ''));
    expect(request.searchParams.get('url')).toBe('https://exemple.fr/?a=1');
    expect(request.searchParams.get('strategy')).toBe('desktop');
    expect(request.searchParams.get('category')).toBe('performance');
    expect(request.searchParams.has('key')).toBe(false);
  });

  it('ajoute la clé quand elle est fournie', () => {
    expect(
      new URL(buildPsiRequest('https://exemple.fr/', 'mobile', 'abc')).searchParams.get('key'),
    ).toBe('abc');
  });
});

describe('parsePsiResponse', () => {
  const sample = {
    lighthouseResult: {
      finalDisplayedUrl: 'https://exemple.fr/',
      categories: { performance: { score: 0.87 } },
      audits: {
        'first-contentful-paint': { score: 0.95, displayValue: '1,2 s' },
        'speed-index': { score: 0.9, displayValue: '2,8 s' },
        'largest-contentful-paint': { score: 0.7, displayValue: '3,1 s' },
        'total-blocking-time': { score: 0.92, displayValue: '160 ms' },
        'cumulative-layout-shift': { score: 1, displayValue: '0,01' },
      },
    },
  };

  it('extrait le score et les métriques', () => {
    const result = parsePsiResponse(sample, 'mobile');
    expect(result.score).toBe(87);
    expect(result.finalUrl).toBe('https://exemple.fr/');
    expect(result.metrics.map((m) => m.id)).toEqual(['fcp', 'si', 'lcp', 'tbt', 'cls']);
    expect(result.metrics[2]).toMatchObject({ displayValue: '3,1 s', score: 70, weight: 25 });
  });

  it('échoue proprement si le score manque', () => {
    expect(() => parsePsiResponse({}, 'mobile')).toThrow();
  });
});

describe('psiErrorMessage', () => {
  it('explique le quota et les pages inaccessibles', () => {
    expect(psiErrorMessage(429, null)).toContain('Réessayez dans une minute');
    expect(
      psiErrorMessage(429, { error: { message: "limit 'Queries per day' exceeded" } }),
    ).toContain("épuisé pour aujourd'hui");
    expect(
      psiErrorMessage(500, {
        error: { message: 'Lighthouse returned error: FAILED_DOCUMENT_REQUEST' },
      }),
    ).toContain("n'a pas pu charger");
  });
});
