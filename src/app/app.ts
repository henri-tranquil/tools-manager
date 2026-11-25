import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  inject,
  viewChild,
} from '@angular/core';
import { OpenTools } from './core/open-tools';
import { SECTIONS } from './core/registry/tools.registry';
import { SearchDialog } from './layout/search-dialog/search-dialog';
import { SiteFooter } from './layout/site-footer/site-footer';
import { SiteHeader } from './layout/site-header/site-header';
import { Hero } from './sections/hero/hero';
import { Realisations } from './sections/realisations/realisations';
import { ToolSection } from './sections/tool-section/tool-section';

@Component({
  selector: 'app-root',
  imports: [SiteHeader, Hero, ToolSection, Realisations, SiteFooter, SearchDialog],
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown)': 'onKeydown($event)' },
})
export class App {
  protected readonly sections = SECTIONS;
  private readonly search = viewChild.required(SearchDialog);

  constructor() {
    const linkedSectionId = inject(OpenTools).linkedSectionId;
    if (linkedSectionId) {
      // Lien direct (?outil=…) : on amène la section de l'outil à l'écran.
      afterNextRender(() =>
        document.getElementById(linkedSectionId)?.scrollIntoView({ behavior: 'instant' }),
      );
    }
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
}
