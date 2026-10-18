import { AfterViewInit, Directive, ElementRef, Input, NgZone, OnDestroy } from '@angular/core';
import { prefersReducedMotion } from '../ink/ink-noise';
import { DESKTOP_MEDIA } from '../layout-mode';
import { SpaceNavService } from '../services/space-nav.service';
import { Subscription } from 'rxjs';
import { Box, CLOSE_MS, OPEN_MS, flip, layoutBox } from '../window-motion';

// Turns the children of a `.pockets` grid into little windows that drift around and bounce off the
// edges (and each other), like the old DVD screensaver. Grab a window by its title bar (the pocket's
// first `.label`) to move it yourself; let go with a flick to throw it.
// The windows are shared out into "spaces" of at most PER_SPACE windows (or `perSpace`; 0 puts them all in one). Each space is one browser
// window tall, with a SPACER gap before the next, and its windows bounce inside it; the page scrolls
// from space to space. Space 0 starts at the very top of the page. Each gap holds a slowly rippling
// wavy ink line (`.space-divider`).
// On phones and tablets (touch, or narrow screens) and with reduced motion the pockets stay static, in
// order, in the normal stacked grid.

const PER_SPACE = 4;     // windows per space
const SPACER = 160;      // px between one space and the next
const CRUISE = 26;       // px/s: the slow screensaver drift
const MAX_FLING = 1400;  // px/s: fastest a thrown window can leave the hand
const SETTLE = 0.6;      // per second: how quickly a thrown window slows back to cruising speed
const EDGE = 8;          // px kept clear of a space's edges
const CROWDED = 0.55;    // windows covering more of a space than this pass over each other

// Positions (x, y) are in page coordinates: from the top-left of the document, not the screen.
interface Body {
  el: HTMLElement;
  handle: HTMLElement | null;
  space: number;
  // The user dragged it into a space of their choosing; don't reassign it.
  movedSpace: boolean;
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

  // Windows per space; 0 means no limit, so every window bounces in the one space.
  @Input() perSpace = PER_SPACE;

  private bodies = new Map<HTMLElement, Body>();
  private active = false;
  private crowdedSpaces = new Set<number>();
  private spaceCount = 1;
  // The host's top-left in page coordinates; windows are positioned (absolutely) relative to it.
  private hostX = 0;
  private hostY = 0;
  private hostHeight = -1;
  private dividers: HTMLElement[] = [];
  // Other spaces below / above the one in view: html.more-below / html.more-above, which pick the arrows
  // shown beside the nav dock.
  private moreBelow = false;
  private moreAbove = false;
  private dividerLayout = '';
  private frame = 0;
  private lastTime = 0;
  private resizeObserver?: ResizeObserver;
  // An opened window remembers where it was bouncing, so closing it shrinks it back to that spot.
  private parked = new Map<HTMLElement, Pick<Body, 'x' | 'y' | 'vx' | 'vy' | 'space' | 'movedSpace'>>();
  private openBoxes = new Map<HTMLElement, Box>();
  private openObserver?: ResizeObserver;
  private readonly onWindowResize = () => this.openBoxes.forEach((_, el) => this.openBoxes.set(el, layoutBox(el)));
  private mutationObserver?: MutationObserver;
  private media?: MediaQueryList;
  private readonly onMediaChange = () => this.updateActive();

  private navSub?: Subscription;

  constructor(private host: ElementRef<HTMLElement>, private zone: NgZone, private spaceNav: SpaceNavService) {}

  ngAfterViewInit(): void {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    this.zone.runOutsideAngular(() => {
      this.media = window.matchMedia(DESKTOP_MEDIA);
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
    this.measureHost();

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

    // The arrows beside the dock slide the page to the start of the next / previous space.
    this.navSub = this.spaceNav.requests.subscribe(step => {
      const inView = this.spaceAt(window.scrollY + window.innerHeight / 2);
      const target = Math.min(Math.max(inView + step, 0), this.spaceCount - 1);
      window.scrollTo({ top: this.spaceTop(target), behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    });

    this.lastTime = performance.now();
    this.frame = requestAnimationFrame(this.tick);
  }

  private deactivate(): void {
    if (!this.active) return;
    this.active = false;
    cancelAnimationFrame(this.frame);
    this.navSub?.unsubscribe();
    this.resizeObserver?.disconnect();
    this.openObserver?.disconnect();
    this.mutationObserver?.disconnect();
    window.removeEventListener('resize', this.onWindowResize);
    this.parked.clear();
    this.openBoxes.clear();
    this.bodies.forEach(body => this.release(body));
    this.bodies.clear();
    this.host.nativeElement.classList.remove('bouncing');
    this.host.nativeElement.style.removeProperty('height');
    this.hostHeight = -1;
    this.dividers.forEach(divider => divider.remove());
    this.setEdges(false, false);
    this.dividers = [];
    this.dividerLayout = '';
    if (--activeFields === 0) document.body.classList.remove('pockets-bouncing');
  }

  // Match the bodies to the field's current children.
  private sync(): void {
    if (!this.active) return;
    this.measureHost();
    // Forget opened windows that were removed while open, so the others don't stay frozen.
    this.parked.forEach((_, el) => {
      if (!el.isConnected) {
        this.parked.delete(el);
        this.openBoxes.delete(el);
      }
    });
    const children = (Array.from(this.host.nativeElement.children) as HTMLElement[])
      .filter(el => !el.classList.contains('space-divider'));
    const wanted = new Set(children.filter(el => !el.classList.contains('wide')));
    this.bodies.forEach((body, el) => {
      if (wanted.has(el)) return;
      const opening = el.isConnected && el.classList.contains('wide') && body.placed;
      const from = this.screenBox(body);
      if (opening) {
        this.parked.set(el, { x: body.x, y: body.y, vx: body.vx, vy: body.vy, space: body.space, movedSpace: body.movedSpace });
      }
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
    const per = this.perSpace > 0 ? this.perSpace : Infinity;
    children.forEach((el, index) => {
      if (!wanted.has(el)) return;
      let body = this.bodies.get(el);
      if (!body) {
        body = this.adopt(el);
        this.bodies.set(el, body);
        const parked = this.parked.get(el);
        const from = this.openBoxes.get(el);
        this.parked.delete(el);
        this.openBoxes.delete(el);
        this.openObserver!.unobserve(el);
        if (parked) {
          // Closing: shrink from the centred window back to the spot it left, then carry on bouncing.
          Object.assign(body, parked, { w: el.offsetWidth, h: el.offsetHeight, placed: true });
          el.style.removeProperty('visibility');
          this.draw(body);
          if (from) {
            body.animating = true;
            flip(el, from, this.screenBox(body), el.style.transform, CLOSE_MS).then(() => body!.animating = false);
          }
        }
      }
      // Windows fill the spaces in page order, perSpace at a time.
      if (!body.movedSpace) body.space = Math.floor(index / per);
    });
    this.spaceCount = Math.max(1, Math.ceil(children.length / per),
      ...Array.from(this.bodies.values(), b => b.space + 1));
    this.updateCrowded();
  }

  private adopt(el: HTMLElement): Body {
    const handle = el.querySelector<HTMLElement>('.pocket > .label:first-child');
    const body: Body = {
      el, handle, space: 0, movedSpace: false, x: 0, y: 0, vx: 0, vy: 0, w: el.offsetWidth, h: el.offsetHeight,
      placed: false, held: false, hovered: false, animating: false, grabX: 0, grabY: 0, lastX: 0, lastY: 0, lastT: 0,
      cleanup: () => {},
    };
    el.style.visibility = 'hidden';
    el.style.zIndex = String(topZ++);

    const onEnter = () => body.hovered = true;
    const onLeave = () => body.hovered = false;
    el.addEventListener('pointerenter', onEnter);
    el.addEventListener('pointerleave', onLeave);

    // Dragging works in page coordinates, so scrolling mid-drag doesn't throw the window off.
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0 || (e.target as HTMLElement).closest('a, button')) return;
      e.preventDefault();
      handle!.setPointerCapture(e.pointerId);
      body.held = true;
      body.grabX = e.pageX - body.x;
      body.grabY = e.pageY - body.y;
      body.lastX = e.pageX;
      body.lastY = e.pageY;
      body.lastT = e.timeStamp;
      body.vx = body.vy = 0;
      el.style.zIndex = String(topZ++);
      document.documentElement.classList.add('grabbing');
    };
    const onMove = (e: PointerEvent) => {
      if (!body.held) return;
      const dt = Math.max(e.timeStamp - body.lastT, 1) / 1000;
      // Smoothed hand speed, used for the throw on release.
      body.vx = 0.6 * ((e.pageX - body.lastX) / dt) + 0.4 * body.vx;
      body.vy = 0.6 * ((e.pageY - body.lastY) / dt) + 0.4 * body.vy;
      body.lastX = e.pageX;
      body.lastY = e.pageY;
      body.lastT = e.timeStamp;
      body.x = e.pageX - body.grabX;
      body.y = e.pageY - body.grabY;
      this.keepInField(body);
      this.draw(body);
    };
    const onUp = (e: PointerEvent) => {
      if (!body.held) return;
      body.held = false;
      document.documentElement.classList.remove('grabbing');
      // Dropped into another space: it lives there now.
      const dropped = this.spaceAt(body.y + body.h / 2);
      if (dropped !== body.space) {
        body.space = dropped;
        body.movedSpace = true;
        this.updateCrowded();
      }
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

  // Drop a new window somewhere free in its space, heading off on a diagonal.
  private place(body: Body): void {
    const { minX, maxX, minY, maxY } = this.bounds(body);
    const others = Array.from(this.bodies.values()).filter(b => b !== body && b.placed && b.space === body.space);
    for (let attempt = 0; attempt < 60; attempt++) {
      body.x = minX + Math.random() * (maxX - minX);
      body.y = minY + Math.random() * (maxY - minY);
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
    this.measureHost();
    const inView = this.spaceAt(window.scrollY + window.innerHeight / 2);
    this.setEdges(inView < this.spaceCount - 1, inView > 0);
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

    for (let i = 0; i < bodies.length; i++) {
      for (let j = i + 1; j < bodies.length; j++) {
        const a = bodies[i];
        const b = bodies[j];
        if (a.space === b.space && !this.crowdedSpaces.has(a.space)) this.collide(a, b);
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
    const { minX, maxX, minY, maxY } = this.bounds(body);
    if (body.x < minX) { body.x = minX; body.vx = Math.abs(body.vx); }
    if (body.x > maxX) { body.x = maxX; body.vx = -Math.abs(body.vx); }
    if (body.y < minY) { body.y = minY; body.vy = Math.abs(body.vy); }
    if (body.y > maxY) { body.y = maxY; body.vy = -Math.abs(body.vy); }
  }

  // While dragging, a window can go anywhere in the field (into another space too).
  private keepInField(body: Body): void {
    const width = document.documentElement.clientWidth;
    const bottom = this.spaceTop(this.spaceCount - 1) + window.innerHeight;
    body.x = Math.min(Math.max(body.x, EDGE), Math.max(EDGE, width - body.w - EDGE));
    body.y = Math.min(Math.max(body.y, EDGE), Math.max(EDGE, bottom - body.h - EDGE));
  }

  // The area a window bounces in: its space, the full width of the browser window.
  private bounds(body: Body) {
    const width = document.documentElement.clientWidth;
    const top = this.spaceTop(body.space);
    return {
      minX: EDGE,
      maxX: Math.max(EDGE, width - body.w - EDGE),
      minY: top + EDGE,
      maxY: Math.max(top + EDGE, top + window.innerHeight - body.h - EDGE),
    };
  }

  private setEdges(below: boolean, above: boolean): void {
    if (below !== this.moreBelow) document.documentElement.classList.toggle('more-below', below);
    if (above !== this.moreAbove) document.documentElement.classList.toggle('more-above', above);
    this.moreBelow = below;
    this.moreAbove = above;
  }

  private spaceTop(space: number): number {
    return space * (window.innerHeight + SPACER);
  }

  private spaceAt(pageY: number): number {
    const space = Math.round((pageY - window.innerHeight / 2) / (window.innerHeight + SPACER));
    return Math.min(Math.max(space, 0), this.spaceCount - 1);
  }

  // Track where the host sits on the page, and make it tall enough to hold every space.
  private measureHost(): void {
    const rect = this.host.nativeElement.getBoundingClientRect();
    this.hostX = rect.left + window.scrollX;
    this.hostY = rect.top + window.scrollY;
    const height = Math.max(0, Math.round(this.spaceTop(this.spaceCount - 1) + window.innerHeight - this.hostY));
    if (height !== this.hostHeight) {
      this.hostHeight = height;
      this.host.nativeElement.style.height = `${height}px`;
    }
    this.layoutDividers();
  }

  // One wavy divider in each gap between spaces, spanning the full browser width.
  private layoutDividers(): void {
    const width = document.documentElement.clientWidth;
    const layout = [this.spaceCount, width, window.innerHeight, this.hostX, this.hostY].join();
    if (layout === this.dividerLayout) return;
    this.dividerLayout = layout;
    while (this.dividers.length < this.spaceCount - 1) {
      const divider = document.createElement('div');
      divider.className = 'space-divider';
      divider.setAttribute('aria-hidden', 'true');
      this.host.nativeElement.appendChild(divider);
      this.dividers.push(divider);
    }
    while (this.dividers.length > this.spaceCount - 1) this.dividers.pop()!.remove();
    this.dividers.forEach((divider, i) => {
      const top = this.spaceTop(i) + window.innerHeight;
      divider.style.width = `${width}px`;
      divider.style.height = `${SPACER}px`;
      divider.style.transform = `translate3d(${-this.hostX}px, ${top - this.hostY}px, 0)`;
    });
  }

  private overlaps(a: Body, b: Body): boolean {
    return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
  }

  private updateCrowded(): void {
    const spaceArea = document.documentElement.clientWidth * window.innerHeight;
    const areas = new Map<number, number>();
    this.bodies.forEach(b => areas.set(b.space, (areas.get(b.space) ?? 0) + b.w * b.h));
    this.crowdedSpaces = new Set(Array.from(areas).filter(([, area]) => area > CROWDED * spaceArea).map(([space]) => space));
  }

  // A window's box on screen (viewport coordinates), for the open/close animations.
  private screenBox(body: Body): Box {
    return { x: body.x - window.scrollX, y: body.y - window.scrollY, w: body.w, h: body.h };
  }

  private draw(body: Body): void {
    body.el.style.transform = `translate3d(${(body.x - this.hostX).toFixed(1)}px, ${(body.y - this.hostY).toFixed(1)}px, 0)`;
  }
}
