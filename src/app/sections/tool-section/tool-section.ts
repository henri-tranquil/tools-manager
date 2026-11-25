import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { OpenTools } from '../../core/open-tools';
import { Section } from '../../core/registry/models';
import { pad2 } from '../../shared/format';
import { ToolPanel } from '../tool-panel/tool-panel';

@Component({
  selector: 'app-tool-section',
  imports: [ToolPanel],
  templateUrl: './tool-section.html',
  styleUrl: './tool-section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToolSection {
  readonly section = input.required<Section>();
  /** Position de la section dans la page, à partir de 1. */
  readonly index = input.required<number>();

  private readonly openTools = inject(OpenTools);

  protected readonly number = computed(() => pad2(this.index()));
  protected readonly openId = computed(() => this.openTools.openToolId(this.section().id));
  protected readonly openTool = computed(
    () => this.section().tools.find((t) => t.id === this.openId()) ?? null,
  );

  protected toggle(toolId: string): void {
    this.openTools.toggle(this.section().id, toolId);
  }

  protected close(): void {
    this.openTools.close(this.section().id);
  }
}
