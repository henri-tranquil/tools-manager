import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  model,
  signal,
  viewChild,
} from '@angular/core';
import type { Point, Stroke } from './recognizer';

/** Rayon de la gomme, relatif à la taille de la zone. */
const ERASER_RADIUS = 0.05;

/** Ajoute des points intermédiaires pour qu'aucun segment ne dépasse `step`. */
function densify(stroke: Stroke, step: number): Point[] {
  const out: Point[] = [];
  stroke.forEach((p, i) => {
    if (i > 0) {
      const prev = stroke[i - 1];
      const n = Math.floor(Math.hypot(p.x - prev.x, p.y - prev.y) / step);
      for (let k = 1; k <= n; k++) {
        out.push({
          x: prev.x + ((p.x - prev.x) * k) / (n + 1),
          y: prev.y + ((p.y - prev.y) * k) / (n + 1),
        });
      }
    }
    out.push(p);
  });
  return out;
}

/**
 * Gomme : retire les parties de traits à moins de `radius` de `center`. Un trait coupé en deux
 * devient deux traits ; les traits non touchés sont conservés tels quels.
 */
export function eraseAt(strokes: readonly Stroke[], center: Point, radius: number): Stroke[] {
  const hit = (p: Point) => Math.hypot(p.x - center.x, p.y - center.y) <= radius;
  const out: Stroke[] = [];
  for (const stroke of strokes) {
    const dense = densify(stroke, radius / 2);
    if (!dense.some(hit)) {
      out.push(stroke);
      continue;
    }
    let part: Point[] = [];
    for (const p of dense) {
      if (hit(p)) {
        if (part.length > 1) {
          out.push(part);
        }
        part = [];
      } else {
        part.push(p);
      }
    }
    if (part.length > 1) {
      out.push(part);
    }
  }
  return out;
}

/**
 * Zone de dessin quadrillée (souris, doigt, stylet). Les traits sont exposés en coordonnées
 * relatives (0 à 1) par le modèle `strokes` : le parent peut les lire, les annuler ou les effacer.
 * Le contenu projeté (un calque SVG par exemple) s'affiche sous le tracé.
 */
@Component({
  selector: 'app-draw-pad',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: block;
      position: relative;
      width: min(100%, var(--pad-size, 380px));
      aspect-ratio: 1;
      border: var(--bw) solid var(--ink);
      border-radius: var(--radius-lg);
      background:
        repeating-linear-gradient(90deg, rgb(17 17 17 / 0.25) 0 8px, transparent 8px 16px) center /
          100% 2px no-repeat,
        repeating-linear-gradient(0deg, rgb(17 17 17 / 0.25) 0 8px, transparent 8px 16px) center /
          2px 100% no-repeat,
        var(--paper);
      box-shadow: var(--shadow-lg);
      overflow: hidden;
    }
    canvas.erasing {
      cursor: cell;
    }
    .eraser {
      position: absolute;
      top: 10px;
      right: 10px;
      z-index: 1;
      padding: 4px 10px;
      border: var(--bw-thin) solid var(--ink);
      border-radius: 999px;
      background: var(--paper);
      box-shadow: var(--shadow-sm);
      font-weight: 700;
      font-size: 13px;
      cursor: pointer;

      &[aria-pressed='true'] {
        background: var(--ink);
        color: var(--yellow);
      }
    }
    canvas {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      touch-action: none;
      cursor: crosshair;
    }
    .hint {
      position: absolute;
      inset: auto 0 14px;
      text-align: center;
      font-family: var(--font-mono);
      font-size: 13px;
      font-weight: 700;
      pointer-events: none;
      opacity: 0.6;
    }
  `,
  template: `
    <ng-content />
    <button
      type="button"
      class="eraser"
      [attr.aria-pressed]="eraser()"
      title="Gomme (ou clic droit pendant le tracé)"
      (click)="eraser.set(!eraser())"
    >
      {{ eraser() ? 'Gomme ✓' : 'Gomme' }}
    </button>
    <canvas
      #canvas
      [class.erasing]="eraser()"
      [attr.aria-label]="label()"
      (pointerdown)="down($event)"
      (pointermove)="move($event)"
      (pointerup)="up($event)"
      (pointercancel)="up($event)"
      (contextmenu)="$event.preventDefault()"
    ></canvas>
    @if (!strokes().length) {
      <p class="hint">{{ hint() }}</p>
    }
  `,
})
export class DrawPad {
  readonly strokes = model<readonly Stroke[]>([]);
  readonly label = input('Zone de dessin : tracez à la souris, au doigt ou au stylet');
  readonly hint = input('Tracez un kana ici');
  /** Mode gomme permanent (bouton) ; le clic droit et la gomme d'un stylet gomment aussi. */
  protected readonly eraser = signal(false);

  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private current: Point[] | null = null;
  /** Pendant un coup de gomme : copie de travail des traits, publiée au relâchement. */
  private erasing: Stroke[] | null = null;
  private cursor: Point | null = null;
  private context: CanvasRenderingContext2D | null = null;

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const canvas = this.canvas().nativeElement;
      this.context = canvas.getContext('2d');
      const observer = new ResizeObserver(() => this.resize());
      observer.observe(canvas);
      destroyRef.onDestroy(() => observer.disconnect());
    });
    // Le parent peut annuler ou effacer : on redessine à chaque changement.
    effect(() => {
      this.strokes();
      this.redraw();
    });
  }

  private point(event: PointerEvent): Point {
    const rect = this.canvas().nativeElement.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) / rect.width,
      y: (event.clientY - rect.top) / rect.height,
    };
  }

  protected down(event: PointerEvent): void {
    // Bouton gauche ou contact : trace ; clic droit (2) ou gomme du stylet (5) : gomme.
    const erase = this.eraser() || event.button === 2 || event.button === 5;
    if (event.button !== 0 && !erase) {
      return;
    }
    event.preventDefault();
    this.canvas().nativeElement.setPointerCapture(event.pointerId);
    if (erase) {
      this.erasing = [...this.strokes()];
      this.erase(this.point(event));
    } else {
      this.current = [this.point(event)];
      this.redraw();
    }
  }

  protected move(event: PointerEvent): void {
    const events = event.getCoalescedEvents?.() ?? [];
    const points = (events.length ? events : [event]).map((e) => this.point(e));
    if (this.erasing) {
      points.forEach((p) => this.erase(p));
    } else if (this.current) {
      this.current.push(...points);
      this.redraw();
    } else if (this.eraser()) {
      this.cursor = points.at(-1) ?? null;
      this.redraw();
    }
  }

  protected up(event: PointerEvent): void {
    if (this.erasing) {
      const result = this.erasing;
      this.erasing = null;
      this.strokes.set(result);
      return;
    }
    if (!this.current) {
      return;
    }
    this.current.push(this.point(event));
    const stroke = this.current;
    this.current = null;
    this.strokes.update((s) => [...s, stroke]);
  }

  private erase(point: Point): void {
    this.erasing = eraseAt(this.erasing ?? [], point, ERASER_RADIUS);
    this.cursor = point;
    this.redraw();
  }

  private resize(): void {
    const canvas = this.canvas().nativeElement;
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.round(canvas.clientWidth * ratio);
    canvas.height = Math.round(canvas.clientHeight * ratio);
    this.redraw();
  }

  private redraw(): void {
    const ctx = this.context;
    if (!ctx) {
      return;
    }
    const { width, height } = ctx.canvas;
    ctx.clearRect(0, 0, width, height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = width * 0.035;
    ctx.strokeStyle = '#111';
    const base = this.erasing ?? this.strokes();
    const all = this.current ? [...base, this.current] : base;
    for (const stroke of all) {
      ctx.beginPath();
      stroke.forEach((p, i) =>
        i ? ctx.lineTo(p.x * width, p.y * height) : ctx.moveTo(p.x * width, p.y * height),
      );
      if (stroke.length === 1) {
        ctx.lineTo(stroke[0].x * width + 0.1, stroke[0].y * height);
      }
      ctx.stroke();
    }
    // Contour de la gomme sous le pointeur.
    if (this.cursor && (this.erasing || this.eraser())) {
      ctx.beginPath();
      ctx.lineWidth = Math.max(2, width * 0.006);
      ctx.strokeStyle = '#ff6b6b';
      ctx.arc(this.cursor.x * width, this.cursor.y * height, ERASER_RADIUS * width, 0, 2 * Math.PI);
      ctx.stroke();
    }
  }
}
