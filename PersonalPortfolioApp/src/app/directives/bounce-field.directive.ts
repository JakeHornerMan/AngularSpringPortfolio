import { AfterViewInit, Directive, ElementRef, NgZone, OnDestroy } from '@angular/core';
import { prefersReducedMotion } from '../ink/ink-noise';
import { Box, CLOSE_MS, OPEN_MS, flip, layoutBox } from '../window-motion';

// Turns the children of a `.pockets` grid into little windows that drift around the browser window
// and bounce off its edges (and each other), like the old DVD screensaver. Grab a window by its title
// bar (the pocket's first `.label`) to move it yourself; let go with a flick to throw it.
// On narrow screens and with reduced motion the pockets stay in the normal stacked grid.

const CRUISE = 26;       // px/s: the slow screensaver drift
const MAX_FLING = 1400;  // px/s: fastest a thrown window can leave the hand
const SETTLE = 0.6;      // per second: how quickly a thrown window slows back to cruising speed
const EDGE = 8;          // px kept clear of the browser window's edges
const MIN_WIDTH = 720;   // below this the pockets stay in the grid
const CROWDED = 0.55;    // windows covering more of the screen than this pass over each other

interface Body {
  el: HTMLElement;
  handle: HTMLElement | null;
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  placed: boolean;
  held: boolean;
  hovered: boolean;
  animating: boolean;
  grabX: number;
  grabY: number;
  lastX: number;
  lastY: number;
  lastT: number;
  cleanup: () => void;
}

// How many fields are bouncing right now; while any are, the page is lifted above the footer.
let activeFields = 0;
let topZ = 2;

@Directive({
  selector: '[appBounceField]'
})
export class BounceFieldDirective implements AfterViewInit, OnDestroy {

  private bodies = new Map<HTMLElement, Body>();
  private active = false;
  private crowded = false;
  private frame = 0;
  private lastTime = 0;
  private resizeObserver?: ResizeObserver;
  // An opened window remembers where it was bouncing, so closing it shrinks it back to that spot.
  private parked = new Map<HTMLElement, Pick<Body, 'x' | 'y' | 'vx' | 'vy'>>();
  private openBoxes = new Map<HTMLElement, Box>();
  private openObserver?: ResizeObserver;
  private readonly onWindowResize = () => this.openBoxes.forEach((_, el) => this.openBoxes.set(el, layoutBox(el)));
  private mutationObserver?: MutationObserver;
  private media?: MediaQueryList;
  private readonly onMediaChange = () => this.updateActive();

  constructor(private host: ElementRef<HTMLElement>, private zone: NgZone) {}

  ngAfterViewInit(): void {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    this.zone.runOutsideAngular(() => {
      this.media = window.matchMedia(`(min-width: ${MIN_WIDTH}px)`);
      this.media.addEventListener('change', this.onMediaChange);
      this.updateActive();
    });
  }

  ngOnDestroy(): void {
    this.media?.removeEventListener('change', this.onMediaChange);
    this.deactivate();
  }

  private updateActive(): void {
    const wanted = !!this.media?.matches && !prefersReducedMotion();
    if (wanted && !this.active) this.activate();
    else if (!wanted && this.active) this.deactivate();
  }

  private activate(): void {
    this.active = true;
    if (activeFields++ === 0) document.body.classList.add('pockets-bouncing');
    this.host.nativeElement.classList.add('bouncing');

    this.resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const body = this.bodies.get(entry.target as HTMLElement);
        if (!body) continue;
        body.w = body.el.offsetWidth;
        body.h = body.el.offsetHeight;
        if (!body.placed) this.place(body);
      }
      this.updateCrowded();
    });
    this.openObserver = new ResizeObserver(entries => {
      for (const entry of entries) this.openBoxes.set(entry.target as HTMLElement, layoutBox(entry.target as HTMLElement));
    });
    window.addEventListener('resize', this.onWindowResize);
    // Pockets arrive with *ngFor after their data loads, and an opened pocket (`.wide`) leaves the field.
    // Synced straight away (before the next paint) so open/close can animate from the old spot.
    this.mutationObserver = new MutationObserver(() => this.sync());
    this.mutationObserver.observe(this.host.nativeElement, {
      childList: true, subtree: true, attributes: true, attributeFilter: ['class'],
    });
    this.sync();

    this.lastTime = performance.now();
    this.frame = requestAnimationFrame(this.tick);
  }

  private deactivate(): void {
    if (!this.active) return;
    this.active = false;
    cancelAnimationFrame(this.frame);
    this.resizeObserver?.disconnect();
    this.openObserver?.disconnect();
    this.mutationObserver?.disconnect();
    window.removeEventListener('resize', this.onWindowResize);
    this.parked.clear();
    this.openBoxes.clear();
    this.bodies.forEach(body => this.release(body));
    this.bodies.clear();
    this.host.nativeElement.classList.remove('bouncing');
    if (--activeFields === 0) document.body.classList.remove('pockets-bouncing');
  }

  // Match the bodies to the field's current children.
  private sync(): void {
    if (!this.active) return;
    // Forget opened windows that were removed while open, so the others don't stay frozen.
    this.parked.forEach((_, el) => {
      if (!el.isConnected) {
        this.parked.delete(el);
        this.openBoxes.delete(el);
      }
    });
    const children = Array.from(this.host.nativeElement.children) as HTMLElement[];
    const wanted = new Set(children.filter(el => !el.classList.contains('wide')));
    this.bodies.forEach((body, el) => {
      if (wanted.has(el)) return;
      const opening = el.isConnected && el.classList.contains('wide') && body.placed;
      const from: Box = { x: body.x, y: body.y, w: body.w, h: body.h };
      if (opening) this.parked.set(el, { x: body.x, y: body.y, vx: body.vx, vy: body.vy });
      this.release(body);
      this.bodies.delete(el);
      if (opening) {
        // Grow from where it was bouncing to its centred, opened size.
        const to = layoutBox(el);
        this.openBoxes.set(el, to);
        this.openObserver!.observe(el);
        flip(el, from, to, 'translate3d(0px, 0px, 0)', OPEN_MS);
      }
    });
    wanted.forEach(el => {
      if (this.bodies.has(el)) return;
      const body = this.adopt(el);
      this.bodies.set(el, body);
      const parked = this.parked.get(el);
      const from = this.openBoxes.get(el);
      this.parked.delete(el);
      this.openBoxes.delete(el);
      this.openObserver!.unobserve(el);
      if (!parked) return;
      // Closing: shrink from the centred window back to the spot it left, then carry on bouncing.
      Object.assign(body, parked, { w: el.offsetWidth, h: el.offsetHeight, placed: true });
      this.keepInside(body);
      el.style.removeProperty('visibility');
      this.draw(body);
      if (from) {
        body.animating = true;
        const at = `translate3d(${body.x}px, ${body.y}px, 0)`;
        flip(el, from, body, at, CLOSE_MS).then(() => body.animating = false);
      }
    });
    this.updateCrowded();
  }

  private adopt(el: HTMLElement): Body {
    const handle = el.querySelector<HTMLElement>('.pocket > .label:first-child');
    const body: Body = {
      el, handle, x: 0, y: 0, vx: 0, vy: 0, w: el.offsetWidth, h: el.offsetHeight,
      placed: false, held: false, hovered: false, animating: false, grabX: 0, grabY: 0, lastX: 0, lastY: 0, lastT: 0,
      cleanup: () => {},
    };
    el.style.visibility = 'hidden';
    el.style.zIndex = String(topZ++);

    const onEnter = () => body.hovered = true;
    const onLeave = () => body.hovered = false;
    el.addEventListener('pointerenter', onEnter);
    el.addEventListener('pointerleave', onLeave);

    const onDown = (e: PointerEvent) => {
      if (e.button !== 0 || (e.target as HTMLElement).closest('a, button')) return;
      e.preventDefault();
      handle!.setPointerCapture(e.pointerId);
      body.held = true;
      body.grabX = e.clientX - body.x;
      body.grabY = e.clientY - body.y;
      body.lastX = e.clientX;
      body.lastY = e.clientY;
      body.lastT = e.timeStamp;
      body.vx = body.vy = 0;
      el.style.zIndex = String(topZ++);
      document.documentElement.classList.add('grabbing');
    };
    const onMove = (e: PointerEvent) => {
      if (!body.held) return;
      const dt = Math.max(e.timeStamp - body.lastT, 1) / 1000;
      // Smoothed hand speed, used for the throw on release.
      body.vx = 0.6 * ((e.clientX - body.lastX) / dt) + 0.4 * body.vx;
      body.vy = 0.6 * ((e.clientY - body.lastY) / dt) + 0.4 * body.vy;
      body.lastX = e.clientX;
      body.lastY = e.clientY;
      body.lastT = e.timeStamp;
      body.x = e.clientX - body.grabX;
      body.y = e.clientY - body.grabY;
      this.keepInside(body);
      this.draw(body);
    };
    const onUp = (e: PointerEvent) => {
      if (!body.held) return;
      body.held = false;
      document.documentElement.classList.remove('grabbing');
      // Held still before letting go: no throw.
      if (e.timeStamp - body.lastT > 80) body.vx = body.vy = 0;
      const speed = Math.hypot(body.vx, body.vy);
      if (speed > MAX_FLING) {
        body.vx *= MAX_FLING / speed;
        body.vy *= MAX_FLING / speed;
      } else if (speed < CRUISE) {
        this.setCruise(body, speed > 5 ? Math.atan2(body.vy, body.vx) : undefined);
      }
    };

    if (handle) {
      handle.classList.add('drag-handle');
      handle.addEventListener('pointerdown', onDown);
      handle.addEventListener('pointermove', onMove);
      handle.addEventListener('pointerup', onUp);
      handle.addEventListener('pointercancel', onUp);
    }

    body.cleanup = () => {
      el.removeEventListener('pointerenter', onEnter);
      el.removeEventListener('pointerleave', onLeave);
      if (handle) {
        handle.classList.remove('drag-handle');
        handle.removeEventListener('pointerdown', onDown);
        handle.removeEventListener('pointermove', onMove);
        handle.removeEventListener('pointerup', onUp);
        handle.removeEventListener('pointercancel', onUp);
      }
    };

    this.resizeObserver!.observe(el);
    return body;
  }

  private release(body: Body): void {
    body.cleanup();
    this.resizeObserver?.unobserve(body.el);
    if (body.held) document.documentElement.classList.remove('grabbing');
    body.el.style.removeProperty('transform');
    body.el.style.removeProperty('visibility');
    body.el.style.removeProperty('z-index');
  }

  // Drop a new window somewhere free, heading off on a diagonal.
  private place(body: Body): void {
    const { width, height } = this.viewport();
    const maxX = Math.max(EDGE, width - body.w - EDGE);
    const maxY = Math.max(EDGE, height - body.h - EDGE);
    const others = Array.from(this.bodies.values()).filter(b => b !== body && b.placed);
    for (let attempt = 0; attempt < 60; attempt++) {
      body.x = EDGE + Math.random() * (maxX - EDGE);
      body.y = EDGE + Math.random() * (maxY - EDGE);
      if (!others.some(b => this.overlaps(body, b))) break;
    }
    this.setCruise(body);
    body.placed = true;
    body.el.style.removeProperty('visibility');
    this.draw(body);
  }

  private setCruise(body: Body, angle?: number): void {
    if (angle === undefined) {
      // A diagonal, never close to straight across or straight down.
      angle = (Math.PI / 7 + Math.random() * (Math.PI / 2 - 2 * Math.PI / 7)) + Math.floor(Math.random() * 4) * (Math.PI / 2);
    }
    body.vx = Math.cos(angle) * CRUISE;
    body.vy = Math.sin(angle) * CRUISE;
  }

  private readonly tick = (now: number) => {
    this.frame = requestAnimationFrame(this.tick);
    const dt = Math.min((now - this.lastTime) / 1000, 0.05);
    this.lastTime = now;
    const bodies = Array.from(this.bodies.values()).filter(b => b.placed);
    // While a window is open the rest hold still behind it (they can still be dragged).
    const frozen = this.parked.size > 0;

    for (const body of bodies) {
      if (frozen || body.held || body.hovered || body.animating) continue;
      // A thrown window eases back down to the screensaver drift.
      const speed = Math.hypot(body.vx, body.vy);
      if (speed > CRUISE) {
        const eased = CRUISE + (speed - CRUISE) * Math.exp(-SETTLE * dt);
        body.vx *= eased / speed;
        body.vy *= eased / speed;
      }
      body.x += body.vx * dt;
      body.y += body.vy * dt;
    }

    if (!this.crowded) {
      for (let i = 0; i < bodies.length; i++) {
        for (let j = i + 1; j < bodies.length; j++) this.collide(bodies[i], bodies[j]);
      }
    }

    for (const body of bodies) {
      if (!body.held) this.bounceOffEdges(body);
      this.draw(body);
    }
  };

  // Axis-aligned bounce, DVD style: whichever side they touch on, both head away from each other.
  // A held or hovered window stands still and the other bounces off it.
  private collide(a: Body, b: Body): void {
    const aStill = a.held || a.hovered || a.animating;
    const bStill = b.held || b.hovered || b.animating;
    if (aStill && bStill) return;
    const dx = (b.x + b.w / 2) - (a.x + a.w / 2);
    const dy = (b.y + b.h / 2) - (a.y + a.h / 2);
    const overlapX = (a.w + b.w) / 2 - Math.abs(dx);
    const overlapY = (a.h + b.h) / 2 - Math.abs(dy);
    if (overlapX <= 0 || overlapY <= 0) return;

    const aShare = aStill ? 0 : bStill ? 1 : 0.5;
    const bShare = 1 - aShare;
    if (overlapX < overlapY) {
      const dir = dx > 0 ? 1 : -1;
      a.x -= dir * overlapX * aShare;
      b.x += dir * overlapX * bShare;
      if (!aStill) a.vx = -dir * Math.abs(a.vx);
      if (!bStill) b.vx = dir * Math.abs(b.vx);
    } else {
      const dir = dy > 0 ? 1 : -1;
      a.y -= dir * overlapY * aShare;
      b.y += dir * overlapY * bShare;
      if (!aStill) a.vy = -dir * Math.abs(a.vy);
      if (!bStill) b.vy = dir * Math.abs(b.vy);
    }
  }

  private bounceOffEdges(body: Body): void {
    const { width, height } = this.viewport();
    const maxX = Math.max(EDGE, width - body.w - EDGE);
    const maxY = Math.max(EDGE, height - body.h - EDGE);
    if (body.x < EDGE) { body.x = EDGE; body.vx = Math.abs(body.vx); }
    if (body.x > maxX) { body.x = maxX; body.vx = -Math.abs(body.vx); }
    if (body.y < EDGE) { body.y = EDGE; body.vy = Math.abs(body.vy); }
    if (body.y > maxY) { body.y = maxY; body.vy = -Math.abs(body.vy); }
  }

  private keepInside(body: Body): void {
    const { width, height } = this.viewport();
    body.x = Math.min(Math.max(body.x, EDGE), Math.max(EDGE, width - body.w - EDGE));
    body.y = Math.min(Math.max(body.y, EDGE), Math.max(EDGE, height - body.h - EDGE));
  }

  private overlaps(a: Body, b: Body): boolean {
    return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
  }

  private updateCrowded(): void {
    const { width, height } = this.viewport();
    let area = 0;
    this.bodies.forEach(b => area += b.w * b.h);
    this.crowded = area > CROWDED * width * height;
  }

  private viewport() {
    return { width: document.documentElement.clientWidth, height: window.innerHeight };
  }

  private draw(body: Body): void {
    body.el.style.transform = `translate3d(${body.x.toFixed(1)}px, ${body.y.toFixed(1)}px, 0)`;
  }
}
