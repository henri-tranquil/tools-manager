import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { OpenTools } from '../../core/open-tools';
import { Section, Tool, ToolKind, UpcomingTool } from '../../core/registry/models';
import { toolPath } from '../../core/site';
import { pad2 } from '../../shared/format';
import { ToolPanel } from '../tool-panel/tool-panel';

interface ToolGroup {
  readonly kind: ToolKind | null;
  /** Titre du sous-bloc (absent : section d'un seul tenant). */
  readonly title: string | null;
  readonly detail: string;
  readonly tools: readonly Tool[];
  readonly upcoming: readonly UpcomingTool[];
}

const GROUPS: readonly {
  kind: ToolKind;
  title: string;
  detail: (n: number, soon: number) => string;
}[] = [
  {
    kind: 'exercice',
    title: "S'entraîner",
    detail: (n) => `${n} exercice${n > 1 ? 's' : ''} · avec score`,
  },
  { kind: 'outil', title: 'Outils', detail: (n) => `${n} outil${n > 1 ? 's' : ''} · sans score` },
  {
    kind: 'examen',
    title: 'Examen blanc',
    detail: (n, soon) => `chronométré${soon ? ` · ${soon} en construction` : ''}`,
  },
];

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

  /**
   * Sous-blocs de la section (exercices, outils, examens) dès qu'un outil déclare sa nature ;
   * sinon un seul bloc sans titre.
   */
  protected readonly groups = computed<readonly ToolGroup[]>(() => {
    const { tools, upcoming = [] } = this.section();
    if (!tools.some((t) => t.kind) && !upcoming.length) {
      return [{ kind: null, title: null, detail: '', tools, upcoming: [] }];
    }
    return GROUPS.map((g) => {
      const own = tools.filter((t) => (t.kind ?? 'outil') === g.kind);
      const soon = upcoming.filter((u) => u.kind === g.kind);
      return {
        kind: g.kind,
        title: g.title,
        detail: g.detail(own.length, soon.length),
        tools: own,
        upcoming: soon,
      };
    }).filter((g) => g.tools.length || g.upcoming.length);
  });

  /** Lien réel vers la page de l'outil (relatif à <base>) : découvrable par les moteurs. */
  protected toolHref(toolId: string): string {
    return `${toolPath(toolId)}/`;
  }

  /** Clic simple : on déplie sur place. Ctrl/⌘/Maj/clic milieu : comportement normal du lien. */
  protected onToolClick(event: MouseEvent, toolId: string): void {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    event.preventDefault();
    this.openTools.toggle(this.section().id, toolId);
  }

  protected close(): void {
    this.openTools.close(this.section().id);
  }
}
