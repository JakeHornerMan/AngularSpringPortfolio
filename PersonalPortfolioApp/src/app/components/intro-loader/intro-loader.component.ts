import { AfterViewInit, Component, ElementRef, NgZone, OnDestroy, ViewChild } from '@angular/core';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { startBusyCursor } from 'src/app/cursors';
import { prefersReducedMotion } from 'src/app/ink/ink-noise';
import { LoadingService } from 'src/app/services/loading.service';
import { PageCurtain, PageTransitionService } from 'src/app/services/page-transition.service';
import { InkFieldComponent } from '../ink-field/ink-field.component';

// The curtain (the inverted ink) stays up until every API request has finished. The caps are only a safety
// net, so a hung request can't trap the page behind it.
// First load: hold at least this long, reveal once data is in, then dissolve.
const INTRO_MIN_SECONDS = 1.2;
const INTRO_MAX_SECONDS = 15;
const INTRO_REVEAL_SECONDS = 2.2;
// Page changes: rings close back in, the new page loads underneath, then they dissolve again.
const COVER_SECONDS = 1.0;
const PAGE_MAX_WAIT_SECONDS = 15;
const PAGE_REVEAL_SECONDS = 1.5;
// After a navigation ends, give the new page a moment to fire its requests before trusting "zero pending".
const SETTLE_MS = 150;

const easeInOutCubic = (x: number) => x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;

interface Tween {
  from: number;
  to: number;
  start: number;
  seconds: number;
  done: () => void;
}

// The ink curtain: the page's ink background inverted (white ink on black).
// On first load it covers the screen until the page and its data are ready, then its rings dissolve
// one by one from the centre outward. On every later navigation it plays that in reverse to cover the
// page (PageTransitionGuard waits for it), the new page loads underneath, and it dissolves again.
@Component({
  selector: 'app-intro-loader',
  templateUrl: './intro-loader.component.html',
  styleUrls: ['./intro-loader.component.css']
})
export class IntroLoaderComponent implements AfterViewInit, OnDestroy, PageCurtain {

  @ViewChild('curtain') curtainRef!: ElementRef<HTMLElement>;
  @ViewChild('ink') ink!: InkFieldComponent;

  // 0 = page fully covered, 1 = curtain fully gone.
  private progress = 0;
  private tween?: Tween;
  private covering?: Promise<void>;
  private frame = 0;
  private navigating = false;
  private navigatedAt = -1;
  private loadedAt = 0;
  private waitingSince = -1;
  private firstLoad = true;
  private dissolve = true;
  private routerSub?: Subscription;
  private stopBusyCursor?: () => void;

  constructor(private router: Router,
    private loading: LoadingService,
    private transition: PageTransitionService,
    private zone: NgZone) { }

  ngAfterViewInit(): void {
    this.loadedAt = performance.now();
    // Without the shader (or with reduced motion) there are no rings to dissolve: fade the curtain instead.
    this.dissolve = this.ink.canReveal && !prefersReducedMotion();
    this.transition.register(this);
    this.show();

    this.routerSub = this.router.events.subscribe(e => {
      if (e instanceof NavigationStart) {
        this.navigating = true;
      } else if (e instanceof NavigationEnd || e instanceof NavigationCancel || e instanceof NavigationError) {
        this.navigating = false;
        this.navigatedAt = performance.now();
        this.transition.markFirstNavigationDone();
        // The curtain is (or is becoming) closed: lift it once the new page is ready.
        if (this.progress < 1 || this.covering) this.waitThenReveal();
      }
    });

    this.waitThenReveal();
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.frame);
    this.routerSub?.unsubscribe();
    this.stopBusyCursor?.();
    document.documentElement.classList.remove('intro-lock');
  }

  // Close the curtain over the current page; resolves once it's fully covered.
  cover(): Promise<void> {
    if (!this.covering) {
      this.waitingSince = -1;
      this.show();
      // If the curtain is already partly closed, close the rest in proportionally less time.
      this.covering = this.animateTo(0, COVER_SECONDS * this.progress)
        .then(() => {
          this.covering = undefined;
          window.scrollTo(0, 0);
        });
    }
    return this.covering;
  }

  private waitThenReveal(): void {
    this.waitingSince = performance.now();
    this.zone.runOutsideAngular(() => this.loop());
  }

  private isReady(now: number): boolean {
    const waited = (now - this.waitingSince) / 1000;
    const sinceLoad = (now - this.loadedAt) / 1000;
    if (this.navigating || this.covering || this.navigatedAt < 0) return false;
    if (waited >= (this.firstLoad ? INTRO_MAX_SECONDS : PAGE_MAX_WAIT_SECONDS)) return true;
    if (this.firstLoad && sinceLoad < INTRO_MIN_SECONDS) return false;
    return now - this.navigatedAt > SETTLE_MS && this.loading.pending === 0;
  }

  private animateTo(target: number, seconds: number): Promise<void> {
    this.tween?.done();
    return new Promise(resolve => {
      this.tween = { from: this.progress, to: target, start: performance.now(), seconds: Math.max(seconds, 0.01), done: resolve };
      this.zone.runOutsideAngular(() => this.loop());
    });
  }

  // One animation loop drives both the tween and the wait-until-ready check, and stops when idle.
  private loop(): void {
    cancelAnimationFrame(this.frame);
    const tick = (now: number) => {
      if (this.tween) {
        const t = this.tween;
        const x = Math.min(1, (now - t.start) / 1000 / t.seconds);
        this.setProgress(t.from + (t.to - t.from) * easeInOutCubic(x));
        if (x >= 1) {
          this.tween = undefined;
          t.done();
          if (this.progress >= 1) this.hide();
        }
      } else if (this.waitingSince >= 0 && this.isReady(now)) {
        this.waitingSince = -1;
        const seconds = this.firstLoad ? INTRO_REVEAL_SECONDS : PAGE_REVEAL_SECONDS;
        this.firstLoad = false;
        this.animateTo(1, seconds);
      }
      if (this.tween || this.waitingSince >= 0) this.frame = requestAnimationFrame(tick);
    };
    this.frame = requestAnimationFrame(tick);
  }

  private setProgress(progress: number): void {
    this.progress = progress;
    if (this.dissolve) {
      this.ink.setRevealProgress(progress);
    } else {
      this.curtainRef.nativeElement.style.opacity = String(1 - progress);
    }
  }

  // Hidden with display:none when idle, which also pauses the ink field's animation.
  // The hourglass cursor turns for as long as the curtain is up.
  private show(): void {
    this.curtainRef.nativeElement.style.display = 'block';
    document.documentElement.classList.add('intro-lock');
    if (!this.stopBusyCursor) this.stopBusyCursor = startBusyCursor();
  }

  private hide(): void {
    this.curtainRef.nativeElement.style.display = 'none';
    document.documentElement.classList.remove('intro-lock');
    this.stopBusyCursor?.();
    this.stopBusyCursor = undefined;
  }
}
