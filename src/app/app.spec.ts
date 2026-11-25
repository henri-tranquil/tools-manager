import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { SECTIONS } from './core/registry/tools.registry';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [App] }).compileComponents();
  });

  it('affiche le titre principal', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('h1')?.textContent).toContain('faits main');
  });

  it('rend une section par entrée du registre, plus les réalisations', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    for (const section of SECTIONS) {
      expect(root.querySelector(`section#${section.id}`)).not.toBeNull();
    }
    expect(root.querySelector('section#realisations')).not.toBeNull();
  });

  it('déplie et replie un outil au clic', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const card = Array.from(root.querySelectorAll<HTMLButtonElement>('#atelier .tool')).find((b) =>
      b.textContent?.includes("Angle d'onglet"),
    );
    expect(card?.getAttribute('aria-expanded')).toBe('false');

    card?.click();
    await fixture.whenStable();
    expect(card?.getAttribute('aria-expanded')).toBe('true');
    expect(root.querySelector('#panel-angle-onglet')).not.toBeNull();

    card?.click();
    await fixture.whenStable();
    expect(root.querySelector('#panel-angle-onglet')).toBeNull();
  });
});
