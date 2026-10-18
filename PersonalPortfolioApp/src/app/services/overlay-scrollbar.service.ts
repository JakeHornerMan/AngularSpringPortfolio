import { Injectable, NgZone } from '@angular/core';

// Mac-style overlay scrollbars. The browser's own scrollbars are hidden (styles.css); instead, whatever
// is scrolling (the page or an element such as an opened window) gets a thin thumb drawn inside its
// edge, which fades in while it scrolls and fades out shortly after. The thumb can be dragged.

const HIDE_AFTER = 900;  // ms after the last scroll
const INSET = 4;         // px between the thumb and the scroller's edge
const MIN_THUMB = 28;    // px

interface Bar {
  thumb: HTMLElement;
  hideTimer: number;
  dragging: boolean;
}

@Injectable({ providedIn: 'root' })
export class OverlayScrollbarService {

  private bars = new Map<Element, Bar>();
  private started = false;

  constructor(private zone: NgZone) {}

  start(): void {
    if (this.started || typeof document === 'undefined') return;
    this.started = true;
    this.zone.runOutsideAngular(() => {
      // Scroll events don't bubble, but capturing on the document sees every scroller's.
      document.addEventListener('scroll', e => this.onScroll(e.target), { capture: true, passive: true });
    });
  }

  private onScroll(target: EventTarget | null): void {
    const scroller = target === document || !(target instanceof Element)
      ? document.scrollingElement
      : target;
    if (!scroller || scroller.scrollHeight <= scroller.clientHeight + 1) return;

    // Elements that come and go (an opened window, a dialog) leave their thumbs behind; tidy them up.
    this.bars.forEach((bar, el) => {
      if (!el.isConnected) {
        bar.thumb.remove();
        this.bars.delete(el);
      }
    });

    const bar = this.bars.get(scroller) ?? this.createBar(scroller);
    this.place(scroller, bar);
    bar.thumb.classList.add('visible');
    this.scheduleHide(bar);
  }

  private createBar(scroller: Element): Bar {
    const thumb = document.createElement('div');
    thumb.className = 'overlay-thumb';
    thumb.setAttribute('aria-hidden', 'true');
    document.body.appendChild(thumb);
    const bar: Bar = { thumb, hideTimer: 0, dragging: false };

    let startY = 0;
    let startScroll = 0;
    thumb.addEventListener('pointerdown', e => {
      if (e.button !== 0) return;
      e.preventDefault();
      thumb.setPointerCapture(e.pointerId);
      bar.dragging = true;
      startY = e.clientY;
      startScroll = scroller.scrollTop;
      thumb.classList.add('dragging');
    });
    thumb.addEventListener('pointermove', e => {
      if (!bar.dragging) return;
      const { trackHeight, thumbHeight } = this.measure(scroller);
      const range = scroller.scrollHeight - scroller.clientHeight;
      scroller.scrollTop = startScroll + (e.clientY - startY) * range / Math.max(trackHeight - thumbHeight, 1);
    });
    const end = () => {
      bar.dragging = false;
      thumb.classList.remove('dragging');
      this.scheduleHide(bar);
    };
    thumb.addEventListener('pointerup', end);
    thumb.addEventListener('pointercancel', end);
    // Keep it showing while the pointer is on it.
    thumb.addEventListener('pointerenter', () => window.clearTimeout(bar.hideTimer));
    thumb.addEventListener('pointerleave', () => this.scheduleHide(bar));

    this.bars.set(scroller, bar);
    return bar;
  }

  private scheduleHide(bar: Bar): void {
    window.clearTimeout(bar.hideTimer);
    bar.hideTimer = window.setTimeout(() => {
      if (!bar.dragging && !bar.thumb.matches(':hover')) bar.thumb.classList.remove('visible');
    }, HIDE_AFTER);
  }

  // The track runs down the scroller's right edge, inside it. A scroller can push the track's top
  // down past a pinned header with the CSS variable --scroll-inset-top.
  private measure(scroller: Element) {
    const isPage = scroller === document.scrollingElement;
    const rect = isPage
      ? { top: 0, right: window.innerWidth, height: window.innerHeight }
      : scroller.getBoundingClientRect();
    const insetTop = parseFloat(getComputedStyle(scroller).getPropertyValue('--scroll-inset-top')) || INSET;
    const trackTop = rect.top + insetTop;
    const trackHeight = rect.height - insetTop - INSET;
    const thumbHeight = Math.max(MIN_THUMB, trackHeight * scroller.clientHeight / scroller.scrollHeight);
    return { right: rect.right, trackTop, trackHeight, thumbHeight };
  }

  private place(scroller: Element, bar: Bar): void {
    const { right, trackTop, trackHeight, thumbHeight } = this.measure(scroller);
    const range = scroller.scrollHeight - scroller.clientHeight;
    const progress = range > 0 ? scroller.scrollTop / range : 0;
    const style = bar.thumb.style;
    style.height = `${thumbHeight}px`;
    style.transform = `translate3d(${right - INSET}px, ${trackTop + (trackHeight - thumbHeight) * progress}px, 0)`;
  }
}
