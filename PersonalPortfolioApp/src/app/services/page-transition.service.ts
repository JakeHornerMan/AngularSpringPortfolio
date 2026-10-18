import { Injectable } from '@angular/core';

// Something that can cover the page before a route change (the ink curtain in IntroLoaderComponent).
export interface PageCurtain {
  cover(): Promise<void>;
}

// Lets the route guard ask the ink curtain to cover the page before the next page is shown.
@Injectable({
  providedIn: 'root'
})
export class PageTransitionService {

  private curtain?: PageCurtain;
  private firstNavigationDone = false;

  register(curtain: PageCurtain): void {
    this.curtain = curtain;
  }

  markFirstNavigationDone(): void {
    this.firstNavigationDone = true;
  }

  // The first page load is revealed by the intro on its own; later navigations wait for the cover.
  beforeNavigate(): Promise<boolean> {
    if (!this.firstNavigationDone || !this.curtain) return Promise.resolve(true);
    return this.curtain.cover().then(() => true);
  }
}
