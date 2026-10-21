import { Injectable } from '@angular/core';
import { watchDesktop } from 'src/app/layout-mode';

export interface OpenableWindow {
  close(): void;
  // The window's element, so a click outside it can close it.
  readonly element: HTMLElement;
}

// Layers that sit above an open window; clicks on them don't count as clicking outside it.
const ABOVE_WINDOWS = 'app-media-window, .cdk-overlay-container, .terminal';

// On desktop only one project / work window can be open at a time. Trying to open another while one is
// open just closes the open one, and so does a click anywhere outside it. On mobile a window closing
// collapses the page under the reader, so there windows close only from their own close button and
// several can be open at once.
@Injectable({ providedIn: 'root' })
export class OpenWindowService {
  private current: OpenableWindow | null = null;
  private downAt: [number, number] | null = null;
  private desktop = true;

  constructor() {
    watchDesktop(desktop => this.desktop = desktop);
    document.addEventListener('pointerdown', event => this.downAt = [event.clientX, event.clientY], true);
    document.addEventListener('click', event => this.clickedAnywhere(event));
  }

  // Returns true if `win` may open now. If a different window is open (on desktop), that one is closed instead.
  requestOpen(win: OpenableWindow): boolean {
    if (!this.desktop) return true;
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

  // On desktop a click outside the open window closes it, unless the pointer moved (the end of a drag or a
  // text selection) or the click landed on something above the window. The click's path is checked rather
  // than where its target is now, because opening a window can remove what was clicked (a small window's thumbnail).
  private clickedAnywhere(event: MouseEvent): void {
    if (!this.desktop || !this.current) return;
    const target = event.target as HTMLElement;
    if (event.composedPath().includes(this.current.element) || target.closest?.(ABOVE_WINDOWS)) return;
    if (this.downAt && Math.hypot(event.clientX - this.downAt[0], event.clientY - this.downAt[1]) > 5) return;
    this.current.close();
  }
}
