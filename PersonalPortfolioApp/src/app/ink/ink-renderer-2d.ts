import { createInkNoise, InkNoise, seededRandom } from './ink-noise';

interface Drop2D {
  x: number;      // centre, as a fraction of width
  y: number;      // centre, as a fraction of height
  rings: number;
  spacing: number; // as a fraction of the larger canvas side
}

export interface InkRendererOptions {
  seed: number;
  density: number;
  waveSpeed: number; // rings per second each drop sends outward
}

// Canvas 2D fallback for browsers without WebGL: strokes each ring as a path. Not interactive.
export class InkRenderer2D {

  private ctx: CanvasRenderingContext2D;
  private noise: InkNoise;
  private drops: Drop2D[];
  private width = 0;
  private height = 0;
  private ink = '#0b0b0b';
  private paper = '#fafaf7';

  constructor(canvas: HTMLCanvasElement, private options: InkRendererOptions) {
    this.ctx = canvas.getContext('2d')!;
    this.noise = createInkNoise(options.seed);
    this.drops = this.createDrops();
  }

  setColors(ink: string, paper: string): void {
    this.ink = ink;
    this.paper = paper;
  }

  resize(width: number, height: number, dpr: number): void {
    const canvas = this.ctx.canvas;
    this.width = width;
    this.height = height;
    canvas.width = Math.max(1, Math.round(width * dpr));
    canvas.height = Math.max(1, Math.round(height * dpr));
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  draw(time: number): void {
    const { ctx, width: w, height: h, ink, paper } = this;
    if (!w || !h) return;

    ctx.fillStyle = paper;
    ctx.fillRect(0, 0, w, h);

    const side = Math.max(w, h);
    const t = time * 0.12;

    this.drops.forEach((drop, d) => {
      const cx = drop.x * w;
      const cy = drop.y * h;
      // Rings keep spreading outward from the drop, a new one forming at the centre as each moves out.
      const travelled = time * this.options.waveSpeed * (d % 2 ? 0.8 : 1);
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

  private createDrops(): Drop2D[] {
    const { seed, density } = this.options;
    const rand = seededRandom(seed * 31 + 1);
    const count = 2 + Math.floor(rand() * 2);
    const drops: Drop2D[] = [];
    for (let i = 0; i < count; i++) {
      drops.push({
        x: 0.2 + rand() * 0.6,
        y: 0.2 + rand() * 0.6,
        rings: Math.round((i === 0 ? 34 : 14 + rand() * 10) * density),
        spacing: (i === 0 ? 0.022 : 0.016) / density,
      });
    }
    return drops;
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
