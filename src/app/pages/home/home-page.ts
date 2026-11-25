import { Location } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  effect,
  inject,
  input,
  OnInit,
  viewChild,
} from '@angular/core';
import { OpenTools } from '../../core/open-tools';
import { SECTIONS } from '../../core/registry/tools.registry';
import { homeSeo, Seo, toolSeo } from '../../core/seo';
import { toolPath } from '../../core/site';
import { SearchDialog } from '../../layout/search-dialog/search-dialog';
import { SiteFooter } from '../../layout/site-footer/site-footer';
import { SiteHeader } from '../../layout/site-header/site-header';
import { Hero } from '../../sections/hero/hero';
import { Realisations } from '../../sections/realisations/realisations';
import { ToolSection } from '../../sections/tool-section/tool-section';

/**
 * L'unique page du site. Elle est prérendue pour l'accueil (`/`) et pour chaque outil
 * (`/outils/<id>/`) : même contenu, mais l'outil ciblé est déplié et les métadonnées
 * (titre, description, canonique, JSON-LD) lui sont propres.
 */
@Component({
  selector: 'app-home-page',
  imports: [SiteHeader, Hero, ToolSection, Realisations, SiteFooter, SearchDialog],
  templateUrl: './home-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown)': 'onKeydown($event)',
    '(document:click)': 'onDocumentClick($event)',
  },
})
export class HomePage implements OnInit {
  /** Identifiant d'outil : paramètre de route `outils/:outil` ou ancien lien `?outil=`. */
  readonly outil = input<string>();

  protected readonly sections = SECTIONS;
  private readonly search = viewChild.required(SearchDialog);
  private readonly openTools = inject(OpenTools);
  private readonly location = inject(Location);
  private readonly document = inject(DOCUMENT);

  constructor() {
    const seo = inject(Seo);
    effect(() => {
      const current = this.openTools.current();
      seo.apply(current ? toolSeo(current.section, current.tool) : homeSeo());
    });

    afterNextRender(() => {
      const current = this.openTools.current();
      if (!current) {
        return;
      }
      // Ancien lien `?outil=…` : on passe à l'URL propre de l'outil.
      if (!this.location.path().startsWith(`/${toolPath('')}`)) {
        this.location.replaceState(toolPath(current.tool.id));
      }
      const target =
        this.document.getElementById(`panel-${current.tool.id}`) ??
        this.document.getElementById(current.section.id);
      target?.scrollIntoView({ behavior: 'instant' });
    });
  }

  ngOnInit(): void {
    this.openTools.openFromUrl(this.outil());
  }

  protected openSearch(): void {
    this.search().open();
  }

  protected onKeydown(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.openSearch();
    }
  }

  /**
   * Les ancres (`#cuisine`…) se résolvent contre la balise <base> : sur `/outils/<id>`, elles
   * mèneraient à l'accueil et rechargeraient la page. On fait défiler sur place à la place.
   */
  protected onDocumentClick(event: MouseEvent): void {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }
    const link = (event.target as Element | null)?.closest?.('a[href^="#"]');
    const id = link?.getAttribute('href')?.slice(1);
    const target = id ? this.document.getElementById(id) : null;
    if (!target) {
      return;
    }
    event.preventDefault();
    target.scrollIntoView({ block: 'start' });
    if (id === 'contenu') {
      target.focus({ preventScroll: true });
    }
  }
}
