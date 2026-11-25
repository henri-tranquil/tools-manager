import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Section, Tool } from '../../core/registry/models';
import { Convertisseur } from '../../tools/conversion/convertisseur/convertisseur';
import { Minuteur } from '../../tools/cuisine/minuteur/minuteur';
import { Lighthouse } from '../../tools/dev/lighthouse/lighthouse';
import { KmEffort } from '../../tools/sport/km-effort/km-effort';

/** Panneau déplié sous les cartes d'une section. Chaque outil est chargé à la demande (@defer). */
@Component({
  selector: 'app-tool-panel',
  imports: [Minuteur, Convertisseur, Lighthouse, KmEffort],
  templateUrl: './tool-panel.html',
  styleUrl: './tool-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToolPanel {
  readonly tool = input.required<Tool>();
  readonly section = input.required<Section>();
  readonly closed = output<void>();
}
