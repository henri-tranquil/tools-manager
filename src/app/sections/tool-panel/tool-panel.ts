import { isPlatformBrowser, NgComponentOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  PLATFORM_ID,
  resource,
} from '@angular/core';
import { Section, Tool } from '../../core/registry/models';
import { PANEL_LOADERS } from '../../tools/panels';

/** Panneau déplié sous les cartes d'une section. Le composant de l'outil est chargé à la demande. */
@Component({
  selector: 'app-tool-panel',
  imports: [NgComponentOutlet],
  templateUrl: './tool-panel.html',
  styleUrl: './tool-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToolPanel {
  readonly tool = input.required<Tool>();
  readonly section = input.required<Section>();
  readonly closed = output<void>();

  /** Les outils utilisent les API du navigateur : au prérendu, seul le texte de l'outil est rendu. */
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  protected readonly component = resource({
    params: () => (this.isBrowser ? this.tool().panel : undefined),
    loader: ({ params }) => PANEL_LOADERS[params](),
  });

  /** Seuls les outils paramétrés reçoivent des entrées (le convertisseur, sa paire d'unités). */
  protected readonly inputs = computed<Record<string, unknown>>(() => {
    const pairId = this.tool().unitPair;
    return pairId ? { pairId } : {};
  });
}
