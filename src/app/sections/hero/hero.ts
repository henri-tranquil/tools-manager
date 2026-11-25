import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Section } from '../../core/registry/models';
import { ACTIVITIES, WORKS_SECTION_ID } from '../../core/registry/tools.registry';
import { formatDecimal } from '../../shared/format';
import {
  COOKING_PRESETS,
  DEFAULT_PRESET_ID,
  formatClock,
} from '../../tools/cuisine/minuteur/presets';
import {
  computeLighthouse,
  LIGHTHOUSE_EXAMPLE,
  scoreBand,
} from '../../tools/dev/lighthouse/lighthouse-score';
import { estimateTrail, formatDuration } from '../../tools/sport/km-effort/trail-estimate';

const TRAIL_EXAMPLE = { distanceKm: 32, elevationM: 1800, paceSecondsPerKm: 390 };

@Component({
  selector: 'app-hero',
  templateUrl: './hero.html',
  styleUrl: './hero.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Hero {
  readonly sections = input.required<readonly Section[]>();

  protected readonly worksId = WORKS_SECTION_ID;
  protected readonly toolCount = computed(() =>
    this.sections().reduce((total, s) => total + s.tools.length, 0),
  );
  /** Les sections d'outils + la section réalisations. */
  protected readonly sectionCount = computed(() => this.sections().length + 1);
  protected readonly firstSectionId = computed(() => this.sections()[0]?.id ?? this.worksId);

  /** Le bandeau est dupliqué pour boucler sans saut. */
  protected readonly marquee = ACTIVITIES.map((a) => a.toUpperCase()).join(' ✶ ') + ' ✶';

  // Autocollants : de vrais résultats calculés par les outils, avec les valeurs d'exemple.
  private readonly lighthouseScore = computeLighthouse(LIGHTHOUSE_EXAMPLE).score;
  protected readonly lighthouse = {
    score: this.lighthouseScore,
    band: scoreBand(this.lighthouseScore),
  };
  protected readonly timer = formatClock(
    COOKING_PRESETS.find((p) => p.id === DEFAULT_PRESET_ID)?.seconds ?? 0,
  );
  private readonly trailEstimate = estimateTrail(
    TRAIL_EXAMPLE.distanceKm,
    TRAIL_EXAMPLE.elevationM,
    TRAIL_EXAMPLE.paceSecondsPerKm,
  );
  protected readonly trail = {
    distance: TRAIL_EXAMPLE.distanceKm,
    elevation: TRAIL_EXAMPLE.elevationM,
    kmEffort: formatDecimal(this.trailEstimate.kmEffort, 1),
    duration: formatDuration(this.trailEstimate.durationSeconds),
  };
}
