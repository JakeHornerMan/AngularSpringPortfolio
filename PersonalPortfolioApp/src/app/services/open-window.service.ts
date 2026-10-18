import { Injectable } from '@angular/core';

export interface OpenableWindow {
  close(): void;
}

// Only one project / work window can be open at a time. Trying to open another while one is open just
// closes the open one.
@Injectable({ providedIn: 'root' })
export class OpenWindowService {
  private current: OpenableWindow | null = null;

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
}
