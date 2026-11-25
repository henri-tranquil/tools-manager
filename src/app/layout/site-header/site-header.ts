import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Section } from '../../core/registry/models';
import { WORKS_SECTION_ID } from '../../core/registry/tools.registry';

@Component({
  selector: 'app-site-header',
  templateUrl: './site-header.html',
  styleUrl: './site-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SiteHeader {
  readonly sections = input.required<readonly Section[]>();
  readonly searchRequested = output<void>();

  protected readonly worksId = WORKS_SECTION_ID;
}
