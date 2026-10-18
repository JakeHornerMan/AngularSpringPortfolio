import { Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { BehaviorSubject } from 'rxjs';

export const HOME_TITLE = 'Jake Horner';

// The big masthead title: "Jake Horner" on the home page, the name of the section everywhere else.
// The app shell resets it to HOME_TITLE at the start of every navigation (once the curtain has covered the
// page); a page that is a section sets its own name when it loads.
@Injectable({ providedIn: 'root' })
export class SectionTitleService {
  readonly title$ = new BehaviorSubject<string>(HOME_TITLE);

  constructor(private documentTitle: Title) {}

  set(title: string): void {
    this.title$.next(title);
    this.documentTitle.setTitle(title === HOME_TITLE ? HOME_TITLE : `${title} · ${HOME_TITLE}`);
  }

  reset(): void {
    this.set(HOME_TITLE);
  }
}
