import { Injectable } from '@angular/core';

export interface OpenableWindow {
  close(): void;
  // The window's element, so a click outside it can close it.
  readonly element: HTMLElement;
}

// Layers that sit above an open window; clicks on them don't count as clicking outside it.
const ABOVE_WINDOWS = 'app-media-window, .cdk-overlay-container, .terminal';

// Only one project / work window can be open at a time. Trying to open another while one is open just
// closes the open one, and so does a click anywhere outside it.
@Injectable({ providedIn: 'root' })
export class OpenWindowService {
  private current: OpenableWindow | null = null;
  private downAt: [number, number] | null = null;

  constructor() {
    document.addEventListener('pointerdown', event => this.downAt = [event.clientX, event.clientY], true);
    document.addEventListener('click', event => this.clickedAnywhere(event));
  }

  // Returns true if `win` may open now. If a different window is open, that one is closed instead.
  requestOpen(win: OpenableWindow): boolean {
    if (this.current && this.current !== win) {
      this.current.close();
      return false;
    }
    this.current = win;
    return true;
  }

  closed(win: OpenableWindow): void {
    if (this.current === win) this.current = null;
  }

  // A click outside the open window closes it, unless the pointer moved (the end of a drag or a text
  // selection) or the click landed on something above the window.
  private clickedAnywhere(event: MouseEvent): void {
    if (!this.current) return;
    const target = event.target as HTMLElement;
    if (this.current.element.contains(target) || target.closest?.(ABOVE_WINDOWS)) return;
    if (this.downAt && Math.hypot(event.clientX - this.downAt[0], event.clientY - this.downAt[1]) > 5) return;
    this.current.close();
  }
}
