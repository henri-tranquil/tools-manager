import { TestBed } from '@angular/core/testing';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from './app.routes';
import { SECTIONS } from './core/registry/tools.registry';

describe('Page unique', () => {
  let harness: RouterTestingHarness;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideRouter(routes, withComponentInputBinding())],
    });
    harness = await RouterTestingHarness.create();
  });

  it('affiche le titre principal et une section par entrée du registre', async () => {
    await harness.navigateByUrl('/');
    const root = harness.routeNativeElement as HTMLElement;
    expect(root.querySelector('h1')?.textContent).toContain('faits main');
    for (const section of SECTIONS) {
      expect(root.querySelector(`section#${section.id}`)).not.toBeNull();
    }
    expect(root.querySelector('section#realisations')).not.toBeNull();
  });

  it('chaque bouton et lien a un nom accessible, même si son texte est masqué sur mobile', async () => {
    await harness.navigateByUrl('/');
    const root = harness.routeNativeElement as HTMLElement;
    const unnamed = [...root.querySelectorAll<HTMLElement>('button, a[href]')].filter((el) => {
      // Le texte d'un élément masqué en CSS ne compte pas : on exige un aria-label dans ce cas.
      const visibleText = [...el.childNodes]
        .filter(
          (n) =>
            n.nodeType === Node.TEXT_NODE ||
            !(n as Element).matches?.('[aria-hidden="true"], .header__search-label, kbd'),
        )
        .map((n) => n.textContent ?? '')
        .join('')
        .trim();
      return !el.getAttribute('aria-label')?.trim() && !visibleText;
    });
    expect(unnamed.map((el) => el.outerHTML.slice(0, 80))).toEqual([]);
  });

  it('chaque carte d’outil interne est un vrai lien vers sa page', async () => {
    await harness.navigateByUrl('/');
    const root = harness.routeNativeElement as HTMLElement;
    const card = root.querySelector<HTMLAnchorElement>('a.tool[href="outils/angle-onglet/"]');
    expect(card).not.toBeNull();
  });

  it('déplie et replie un outil au clic, sans quitter la page', async () => {
    await harness.navigateByUrl('/');
    const root = harness.routeNativeElement as HTMLElement;
    const card = root.querySelector<HTMLAnchorElement>('a.tool[href="outils/angle-onglet/"]')!;
    expect(card.getAttribute('aria-expanded')).toBe('false');

    card.click();
    await harness.fixture.whenStable();
    expect(card.getAttribute('aria-expanded')).toBe('true');
    expect(root.querySelector('#panel-angle-onglet')).not.toBeNull();

    card.click();
    await harness.fixture.whenStable();
    expect(root.querySelector('#panel-angle-onglet')).toBeNull();
  });

  it('la page d’un outil ne déplie que cet outil et pose ses métadonnées', async () => {
    await harness.navigateByUrl('/outils/cron');
    await harness.fixture.whenStable();
    const root = harness.routeNativeElement as HTMLElement;
    expect([...root.querySelectorAll('.panel')].map((p) => p.id)).toEqual(['panel-cron']);
    expect(document.title).toBe("Cron en clair — Web & dev | L'Établi");
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(
      'https://henri-tranquil.github.io/tools-manager/outils/cron/',
    );
  });
});
