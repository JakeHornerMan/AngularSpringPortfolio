import { AfterViewInit, Component, ElementRef, Input, NgZone, OnDestroy, ViewChild } from '@angular/core';
import { createInkNoise, InkNoise, prefersReducedMotion, seededRandom } from 'src/app/ink/ink-noise';

interface Drop {
  x: number;      // centre, as a fraction of width
  y: number;      // centre, as a fraction of height
  rings: number;
  spacing: number; // as a fraction of the larger canvas side
}

// Suminagashi: concentric ink rings floating on water, drifting slowly.
@Component({
  selector: 'app-ink-field',
  template: '<canvas #canvas aria-hidden="true"></canvas>',
  styleUrls: ['./ink-field.component.css']
})
export class InkFieldComponent implements AfterViewInit, OnDestroy {

  @Input() seed = 7;
  @Input() animate = true;
  @Input() inverted = false;
  @Input() density = 1;
  // Rings per second that each drop sends outward.
  @Input() waveSpeed = 0.08;

  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  private ctx!: CanvasRenderingContext2D;
  private noise!: InkNoise;
  private drops: Drop[] = [];
  private width = 0;
  private height = 0;
  private frame = 0;
  private visible = true;
  private startTime = 0;
  private resizeObserver?: ResizeObserver;
  private intersectionObserver?: IntersectionObserver;

  constructor(private host: ElementRef<HTMLElement>, private zone: NgZone) { }

  ngAfterViewInit(): void {
    this.ctx = this.canvasRef.nativeElement.getContext('2d')!;
    this.noise = createInkNoise(this.seed);
    this.drops = this.createDrops();
    this.startTime = performance.now();

    this.zone.runOutsideAngular(() => {
      this.resizeObserver = new ResizeObserver(() => this.resize());
      this.resizeObserver.observe(this.host.nativeElement);
      this.intersectionObserver = new IntersectionObserver(entries => {
        this.visible = entries[0].isIntersecting;
        if (this.visible) this.loop();
      });
      this.intersectionObserver.observe(this.host.nativeElement);
      this.resize();
      this.loop();
    });
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.frame);
    this.resizeObserver?.disconnect();
    this.intersectionObserver?.disconnect();
  }

  private createDrops(): Drop[] {
    const rand = seededRandom(this.seed * 31 + 1);
    const count = 2 + Math.floor(rand() * 2);
    const drops: Drop[] = [];
    for (let i = 0; i < count; i++) {
      drops.push({
        x: 0.2 + rand() * 0.6,
        y: 0.2 + rand() * 0.6,
        rings: Math.round((i === 0 ? 34 : 14 + rand() * 10) * this.density),
        spacing: (i === 0 ? 0.022 : 0.016) / this.density,
      });
    }
    return drops;
  }

  private resize(): void {
    const canvas = this.canvasRef.nativeElement;
    const rect = this.host.nativeElement.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = rect.width;
    this.height = rect.height;
    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.draw((performance.now() - this.startTime) / 1000);
  }

  private loop(): void {
    cancelAnimationFrame(this.frame);
    if (!this.animate || prefersReducedMotion()) {
      this.draw(0);
      return;
    }
    const tick = () => {
      if (!this.visible) return;
      this.draw((performance.now() - this.startTime) / 1000);
      this.frame = requestAnimationFrame(tick);
    };
    this.frame = requestAnimationFrame(tick);
  }

  private draw(time: number): void {
    const { ctx, width: w, height: h } = this;
    if (!w || !h) return;
    const styles = getComputedStyle(this.host.nativeElement);
    const ink = styles.getPropertyValue(this.inverted ? '--paper' : '--ink').trim() || (this.inverted ? '#fafaf7' : '#0b0b0b');
    const paper = styles.getPropertyValue(this.inverted ? '--ink' : '--paper').trim() || (this.inverted ? '#0b0b0b' : '#fafaf7');

    ctx.fillStyle = paper;
    ctx.fillRect(0, 0, w, h);

    const side = Math.max(w, h);
    const t = time * 0.12;

    this.drops.forEach((drop, d) => {
      const cx = drop.x * w;
      const cy = drop.y * h;
      // Rings keep spreading outward from the drop, a new one forming at the centre as each moves out.
      const travelled = time * this.waveSpeed * (d % 2 ? 0.8 : 1);
      const phase = travelled % 1;
      const cycle = Math.floor(travelled);
      const outer = drop.rings + phase;
      // Later drops land on top of earlier rings and push them aside: clear underneath first.
      if (d > 0) {
        this.ringPath(cx, cy, outer * drop.spacing * side, outer, t, d);
        ctx.fillStyle = paper;
        ctx.fill();
      }
      for (let k = drop.rings - 1; k >= 0; k--) {
        const r = k + phase;
        if (r <= 0.05) continue;
        // Identity that stays with a ring as it travels outward, so its weight doesn't flicker.
        const ring = ((k - cycle) % 6 + 6) % 6;
        this.ringPath(cx, cy, r * drop.spacing * side, r, t, d);
        ctx.strokeStyle = ink;
        ctx.lineWidth = ring % 3 === 0 ? 2.4 : 1;
        // Newest ring fades in at the centre; outermost fades out at the edge of the drop.
        const fadeIn = Math.min(1, r);
        const fadeOut = Math.min(1, drop.rings - r);
        ctx.globalAlpha = (0.45 + 0.4 * (ring % 2)) * fadeIn * fadeOut;
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    });
  }

  private ringPath(cx: number, cy: number, radius: number, k: number, t: number, d: number): void {
    const { ctx, noise } = this;
    const steps = 120;
    ctx.beginPath();
    for (let i = 0; i <= steps; i++) {
      const a = (i / steps) * Math.PI * 2;
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      // Ring wobble grows with radius, like ink stretched by the water's surface.
      const wobble = 1 + 0.16 * noise(ca * 1.4 + d * 3, sa * 1.4 + k * 0.035, t);
      let x = cx + ca * radius * wobble;
      let y = cy + sa * radius * wobble;
      // Water flow: a slow swell rolling across the surface plus eddies, so the rings marble.
      y += 22 * Math.sin(x * 0.0045 + t * 2.2);
      x += 34 * noise(y * 0.006, x * 0.002 + 5, t * 0.7);
      y += 22 * noise(x * 0.005 + 11, y * 0.002, t * 0.6);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
  }
}
