import { ChangeDetectionStrategy, Component } from '@angular/core';
import { REPOSITORY_URL } from '../../core/registry/tools.registry';

@Component({
  selector: 'app-site-footer',
  templateUrl: './site-footer.html',
  styleUrl: './site-footer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SiteFooter {
  protected readonly repositoryUrl = REPOSITORY_URL;
}
