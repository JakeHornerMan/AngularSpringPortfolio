import { AfterViewInit, Component, ElementRef, Input, NgZone, OnDestroy, ViewChild } from '@angular/core';
import { prefersReducedMotion, seededRandom, SESSION_SEED } from 'src/app/ink/ink-noise';
import { InkRenderer2D } from 'src/app/ink/ink-renderer-2d';
import { INK_FRAGMENT_SHADER, INK_VERTEX_SHADER, linePotential, MAX_DROPS } from 'src/app/ink/ink-shader';

interface DropSpec {
  x: number;      // centre, as a fraction of width
  y: number;      // centre, as a fraction of height
  weight: number; // how strongly this drop's rings dominate
  phase: number;  // offsets its slow drift
}

const UNIFORM_NAMES = ['uRes', 'uDpr', 'uTime', 'uInk', 'uPaper', 'uDrops', 'uSpacing', 'uSeed', 'uReveal', 'uRevealFade'] as const;

// How many rings fade at once during a reveal, and the margin (in rings) for the warp moving lines
// beyond the unwarped range we sample.
const REVEAL_FADE = 4;

// Number of ink drops the rings spread out from.
const SOURCES = 3;
const REVEAL_MARGIN = 10;
type Uniforms = Record<typeof UNIFORM_NAMES[number], WebGLUniformLocation | null>;

// The water moves slowly, so 30fps looks the same as 60 and halves the GPU work.
const FRAME_INTERVAL = 1000 / 30;

// Suminagashi: ink lines floating on slowly moving water. Drawn by a WebGL shader (see ink-shader.ts),
// with the Canvas 2D renderer as a fallback where WebGL isn't available.
@Component({
  selector: 'app-ink-field',
  template: '<canvas #canvas aria-hidden="true"></canvas>',
  styleUrls: ['./ink-field.component.css']
})
export class InkFieldComponent implements AfterViewInit, OnDestroy {

  @Input() seed = SESSION_SEED;
  @Input() animate = true;
  @Input() inverted = false;
  // Higher = more lines on screen.
  @Input() density = 1;
  // Rings per second that each drop sends outward (2D fallback only).
  @Input() waveSpeed = 0.08;
  // Used by the intro: the sheet can be dissolved ring by ring with setRevealProgress().
  @Input() revealMode = false;

  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  private gl?: WebGLRenderingContext;
  private uniforms = {} as Uniforms;
  private fallback?: InkRenderer2D;
  private drops: DropSpec[] = [];
  private dropData = new Float32Array(MAX_DROPS * 4);
  private width = 0;
  private height = 0;
  private dpr = 1;
  private frame = 0;
  private lastFrame = 0;
  private visible = true;
  private startTime = 0;
  private still = false;
  private resizeObserver?: ResizeObserver;
  private intersectionObserver?: IntersectionObserver;
  private onVisibilityChange = () => { if (!document.hidden) this.loop(); };
  private revealFrom = 0;
  private revealTo = 0;
  private revealProgress = 0;

  // Ring-by-ring reveal needs the shader; the 2D fallback can't do it.
  get canReveal(): boolean {
    return !!this.gl;
  }

  // 0 = every ring showing, 1 = every ring gone (fully transparent).
  setRevealProgress(progress: number): void {
    this.revealProgress = progress;
    this.applyReveal();
  }

  constructor(private host: ElementRef<HTMLElement>, private zone: NgZone) { }

  ngAfterViewInit(): void {
    this.startTime = performance.now();
    this.still = !this.animate || prefersReducedMotion();
    this.drops = this.createDrops();

    const canvas = this.canvasRef.nativeElement;
    if (!this.initWebGL(canvas)) {
      // A canvas that has handed out a WebGL context can never give a 2D one, so swap in a fresh canvas.
      const fresh = canvas.cloneNode() as HTMLCanvasElement;
      canvas.replaceWith(fresh);
      this.canvasRef = new ElementRef(fresh);
      this.fallback = new InkRenderer2D(fresh, { seed: this.seed, density: this.density, waveSpeed: this.waveSpeed });
    }

    this.zone.runOutsideAngular(() => {
      this.resizeObserver = new ResizeObserver(() => this.resize());
      this.resizeObserver.observe(this.host.nativeElement);
      this.intersectionObserver = new IntersectionObserver(entries => {
        this.visible = entries[0].isIntersecting;
        if (this.visible) this.loop();
      });
      this.intersectionObserver.observe(this.host.nativeElement);
      document.addEventListener('visibilitychange', this.onVisibilityChange);
      this.resize();
      this.loop();
    });
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.frame);
    this.resizeObserver?.disconnect();
    this.intersectionObserver?.disconnect();
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    this.gl?.getExtension('WEBGL_lose_context')?.loseContext();
  }

  private now(): number {
    return (performance.now() - this.startTime) / 1000;
  }

  private createDrops(): DropSpec[] {
    const rand = seededRandom(this.seed * 31 + 1);
    // Three sources, one in each third of the screen so they stay apart, at different heights.
    const drops: DropSpec[] = [];
    for (let i = 0; i < SOURCES; i++) {
      drops.push({
        x: (i + 0.35 + rand() * 0.3) / SOURCES,
        y: 0.2 + rand() * 0.6,
        weight: 0.8 + rand() * 0.45,
        phase: rand() * Math.PI * 2,
      });
    }
    return drops;
  }

  private initWebGL(canvas: HTMLCanvasElement): boolean {
    const gl = canvas.getContext('webgl', { antialias: false, alpha: this.revealMode, premultipliedAlpha: true });
    if (!gl || !gl.getExtension('OES_standard_derivatives')) return false;

    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type)!;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.warn('Ink shader failed to compile, using 2D fallback:', gl.getShaderInfoLog(shader));
        return null;
      }
      return shader;
    };
    const vertex = compile(gl.VERTEX_SHADER, INK_VERTEX_SHADER);
    const fragment = compile(gl.FRAGMENT_SHADER, INK_FRAGMENT_SHADER);
    if (!vertex || !fragment) return false;

    const program = gl.createProgram()!;
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.warn('Ink shader failed to link, using 2D fallback:', gl.getProgramInfoLog(program));
      return false;
    }
    gl.useProgram(program);

    // One triangle that covers the whole screen.
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, 'aPosition');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    UNIFORM_NAMES.forEach(name => this.uniforms[name] = gl.getUniformLocation(program, name));
    gl.uniform1f(this.uniforms.uSeed, (this.seed % 997) / 997);
    gl.uniform1f(this.uniforms.uReveal, -1e9);
    gl.uniform1f(this.uniforms.uRevealFade, REVEAL_FADE);

    this.gl = gl;
    return true;
  }

  private resize(): void {
    const rect = this.host.nativeElement.getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height;
    // The GPU path shades every pixel, so cap its resolution a little lower than the 2D path.
    this.dpr = Math.min(window.devicePixelRatio || 1, this.gl ? 1.5 : 2);

    const styles = getComputedStyle(this.host.nativeElement);
    const ink = styles.getPropertyValue(this.inverted ? '--paper' : '--ink').trim() || (this.inverted ? '#fafaf7' : '#0b0b0b');
    const paper = styles.getPropertyValue(this.inverted ? '--ink' : '--paper').trim() || (this.inverted ? '#0b0b0b' : '#fafaf7');

    if (this.fallback) {
      this.fallback.setColors(ink, paper);
      this.fallback.resize(this.width, this.height, this.dpr);
    } else if (this.gl) {
      const canvas = this.canvasRef.nativeElement;
      canvas.width = Math.max(1, Math.round(this.width * this.dpr));
      canvas.height = Math.max(1, Math.round(this.height * this.dpr));
      this.gl.viewport(0, 0, canvas.width, canvas.height);
      this.gl.uniform3fv(this.uniforms.uInk, hexToRgb(ink));
      this.gl.uniform3fv(this.uniforms.uPaper, hexToRgb(paper));
      this.layoutDrops();
    }
    this.draw(this.still ? 0 : this.now());
  }

  // Drop positions and line spacing are relative to the screen, so recompute them on resize.
  private layoutDrops(): void {
    this.dropData.fill(0);
    this.drops.forEach((drop, i) => {
      this.dropData.set([drop.x * this.width, drop.y * this.height, drop.weight, drop.phase], i * 4);
    });
    // Aim for roughly 32 rings from a source out to the far side of the screen.
    const diagonal = Math.hypot(this.width, this.height);
    const spacing = Math.pow(diagonal * 0.5, 0.8) / (32 * this.density);
    this.gl?.uniform1f(this.uniforms.uSpacing, spacing);

    if (this.revealMode) {
      // Sample the unwarped field across the screen to find which ring numbers are visible.
      let min = Infinity;
      let max = -Infinity;
      for (let gx = 0; gx <= 24; gx++) {
        for (let gy = 0; gy <= 16; gy++) {
          const v = linePotential(gx / 24 * this.width, gy / 16 * this.height, this.dropData, this.drops.length) / spacing;
          min = Math.min(min, v);
          max = Math.max(max, v);
        }
      }
      this.revealFrom = min - REVEAL_MARGIN;
      this.revealTo = max + REVEAL_MARGIN + REVEAL_FADE;
      this.applyReveal();
    }
  }

  private applyReveal(): void {
    if (!this.gl || !this.revealMode) return;
    const reveal = this.revealFrom + (this.revealTo - this.revealFrom) * this.revealProgress;
    this.gl.uniform1f(this.uniforms.uReveal, reveal);
  }

  private loop(): void {
    cancelAnimationFrame(this.frame);
    if (this.still) {
      this.draw(0);
      return;
    }
    const tick = (now: number) => {
      if (!this.visible || document.hidden) return;
      // A few ms of slack so a 60Hz display lands on exactly every second frame instead of
      // sometimes skipping three, which would make the motion stutter.
      // The intro reveal moves quickly, so it draws every frame.
      if (this.revealMode || now - this.lastFrame >= FRAME_INTERVAL - 4) {
        this.lastFrame = now;
        this.draw(this.now());
      }
      this.frame = requestAnimationFrame(tick);
    };
    this.frame = requestAnimationFrame(tick);
  }

  private draw(time: number): void {
    if (!this.width || !this.height) return;
    if (this.fallback) {
      this.fallback.draw(time);
      return;
    }
    const gl = this.gl;
    if (!gl) return;
    const u = this.uniforms;
    gl.uniform2f(u.uRes, this.width, this.height);
    gl.uniform1f(u.uDpr, this.dpr);
    gl.uniform1f(u.uTime, time);
    gl.uniform4fv(u.uDrops, this.dropData);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
}

function hexToRgb(color: string): [number, number, number] {
  const hex = color.replace('#', '');
  const full = hex.length === 3 ? hex.split('').map(c => c + c).join('') : hex;
  const n = parseInt(full, 16);
  if (isNaN(n)) return [0, 0, 0];
  return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255];
}
