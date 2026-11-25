import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { WORKS, WORKS_SECTION_ID } from '../../core/registry/tools.registry';
import { pad2 } from '../../shared/format';

@Component({
  selector: 'app-realisations',
  imports: [NgTemplateOutlet],
  templateUrl: './realisations.html',
  styleUrl: './realisations.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Realisations {
  readonly index = input.required<number>();

  protected readonly id = WORKS_SECTION_ID;
  protected readonly works = WORKS;
  protected readonly number = computed(() => pad2(this.index()));

  protected hostOf(url: string): string {
    try {
      return new URL(url).host;
    } catch {
      return 'bientôt en ligne';
    }
  }
}
