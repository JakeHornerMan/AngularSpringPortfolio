import { AfterViewInit, Component, ElementRef, NgZone, OnDestroy, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { NavigationCancel, NavigationEnd, NavigationError, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter, first } from 'rxjs/operators';
import { createInkNoise, prefersReducedMotion } from 'src/app/ink/ink-noise';
import { LoadingService } from 'src/app/services/loading.service';

const MIN_SECONDS = 1.4;
const MAX_SECONDS = 4;
const OPEN_SECONDS = 0.7;
const EXIT_SECONDS = 0.95;
const FADE_MS = 450;

const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);
const easeInOutCubic = (x: number) => x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;

// Full-screen black that is swept off to the right by a marbled-ink edge, revealing the name.
// Created once per app bootstrap, so it plays on every full page load but never on in-app navigation.
@Component({
  selector: 'app-intro-loader',
  templateUrl: './intro-loader.component.html',
  styleUrls: ['./intro-loader.component.css']
})
export class IntroLoaderComponent implements AfterViewInit, OnDestroy {

  visible = true;
  fading = false;

  // Stroke offsets either side of the edge: positive = inside the black, negative = trailing on the paper.
  readonly inkRipples = [-34, -64, -100, -142];
  readonly paperRipples = [12, 26, 44, 66, 92, 124, 162];

  @ViewChild('black') blackRef!: ElementRef<SVGPathElement>;
  @ViewChildren('inkRipple') inkRippleRefs!: QueryList<ElementRef<SVGPathElement>>;
  @ViewChildren('paperRipple') paperRippleRefs!: QueryList<ElementRef<SVGPathElement>>;

  private noise = createInkNoise(19);
  private frame = 0;
  private navigatedAt = -1;
  private routerSub?: Subscription;

  constructor(private router: Router, private loading: LoadingService, private zone: NgZone) { }

  ngAfterViewInit(): void {
    document.documentElement.classList.add('intro-lock');
    this.routerSub = this.router.events.pipe(
      filter(e => e instanceof NavigationEnd || e instanceof NavigationCancel || e instanceof NavigationError),
      first()
    ).subscribe(() => this.navigatedAt = performance.now());

    this.zone.runOutsideAngular(() => this.run());
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.frame);
    this.routerSub?.unsubscribe();
    document.documentElement.classList.remove('intro-lock');
  }

  // The first page has rendered and its data has arrived (or we've waited long enough).
  private isReady(now: number, elapsed: number): boolean {
    if (elapsed >= MAX_SECONDS) return true;
    if (elapsed < MIN_SECONDS || this.navigatedAt < 0) return false;
    // Give the routed component a moment to fire its requests before trusting "zero pending".
    return now - this.navigatedAt > 150 && this.loading.pending === 0;
  }

  private run(): void {
    const start = performance.now();
    const reduced = prefersReducedMotion();
    let progress = 0;
    let exitFrom = -1;
    let exitStart = 0;

    if (reduced) this.blackRef.nativeElement.setAttribute('d', '');

    const tick = (now: number) => {
      const elapsed = (now - start) / 1000;

      if (exitFrom < 0) {
        if (elapsed < OPEN_SECONDS) {
          progress = 0.35 * easeOutCubic(elapsed / OPEN_SECONDS);
        } else {
          // Creep forward while waiting, like pushing against something heavy.
          progress += (0.62 - progress) * 0.012;
        }
        if (this.isReady(now, elapsed)) {
          exitFrom = progress;
          exitStart = now;
        }
      } else {
        const x = Math.min(1, (now - exitStart) / 1000 / EXIT_SECONDS);
        progress = exitFrom + (1 - exitFrom) * easeInOutCubic(x);
        if (x >= 1) {
          this.finish();
          return;
        }
      }

      if (!reduced) this.render(progress, elapsed);
      this.frame = requestAnimationFrame(tick);
    };
    this.frame = requestAnimationFrame(tick);
  }

  private render(progress: number, time: number): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const amp = Math.min(70, w * 0.06);
    const trail = Math.abs(this.inkRipples[this.inkRipples.length - 1]) + amp;
    // From fully covered (edge left of the screen) to fully gone (trailing ripples right of the screen).
    const edgeX = -amp + progress * (w + amp + trail);
    const t = time * 1.6;
    const step = 24;

    const edgeAt = (y: number) =>
      edgeX
      + amp * 0.6 * this.noise(y * 0.006, 1.7, t)
      + amp * 0.4 * this.noise(y * 0.019, 4.1, t * 1.3);

    const linePoints = (offset: number, i: number) => {
      const pts: string[] = [];
      for (let y = -step; y <= h + step; y += step) {
        // Spacing between rings breathes along the edge so they read as marbled, not parallel.
        const spread = 1 + 0.35 * this.noise(y * 0.011 + i * 2.3, i * 0.9, t * 0.8);
        pts.push(`${(edgeAt(y) + offset * spread).toFixed(1)},${y}`);
      }
      return pts;
    };

    const edge = linePoints(0, 0);
    this.blackRef.nativeElement.setAttribute('d', `M${w + trail * 2},-${step} L${edge.join(' L')} L${w + trail * 2},${h + step} Z`);

    this.paperRippleRefs.forEach((ref, i) =>
      ref.nativeElement.setAttribute('d', 'M' + linePoints(this.paperRipples[i], i + 1).join(' L')));
    this.inkRippleRefs.forEach((ref, i) =>
      ref.nativeElement.setAttribute('d', 'M' + linePoints(this.inkRipples[i], i + 9).join(' L')));
  }

  private finish(): void {
    this.zone.run(() => this.fading = true);
    document.documentElement.classList.remove('intro-lock');
    setTimeout(() => this.zone.run(() => this.visible = false), FADE_MS);
  }
}
