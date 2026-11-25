import type { UnitPairId } from '../../tools/conversion/convertisseur/unit-pairs';
import type { ToolPanel } from '../../tools/panels';

export type { ToolPanel };

/**
 * - `internal` : codé dans ce dépôt, se déplie sur place dans sa section.
 * - `external` : outil autonome hébergé ailleurs, ouvert dans un nouvel onglet.
 * - `link`     : simple ressource (recette, article), ouverte dans un nouvel onglet.
 */
export type ToolType = 'internal' | 'external' | 'link';

export interface Tool {
  /** Identifiant unique sur tout le site : il donne l'URL de l'outil (`/outils/<id>/`). */
  readonly id: string;
  readonly title: string;
  readonly description: string;
  /**
   * Présentation de l'outil (≤ 160 caractères) : texte de la page `/outils/<id>/`,
   * meta description et données structurées. C'est le contenu que les moteurs indexent.
   */
  readonly about?: string;
  /** Texte très court affiché dans la vignette (« LH », « D+ », « °F »…). */
  readonly mono: string;
  readonly type: ToolType;
  /** Composant à déplier, pour les outils `internal` (voir `tools/panels.ts`). */
  readonly panel?: ToolPanel;
  /** Pour le panneau `convertisseur`. */
  readonly unitPair?: UnitPairId;
  /** Pour les types `external` et `link`. */
  readonly url?: string;
}

export interface Section {
  readonly id: string;
  readonly title: string;
  /** Couleur de fond de la section (texte toujours #111 dessus). */
  readonly color: string;
  readonly tags: readonly string[];
  readonly description: string;
  readonly tools: readonly Tool[];
  /** Outil déplié au chargement, pour mettre en avant les outils vitrines. */
  readonly defaultOpen?: string;
}

export interface Work {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  /** Laisser vide tant que l'URL publique n'est pas renseignée : la carte n'est alors pas cliquable. */
  readonly url: string;
  readonly color: string;
  readonly techs: readonly string[];
}
