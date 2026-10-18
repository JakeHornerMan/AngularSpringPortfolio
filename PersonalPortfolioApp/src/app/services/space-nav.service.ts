import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

// The arrows beside the nav dock ask the bouncing field (BounceFieldDirective) to slide the page to the
// next (+1) or previous (-1) space of windows.
@Injectable({ providedIn: 'root' })
export class SpaceNavService {
  readonly requests = new Subject<1 | -1>();

  next(): void {
    this.requests.next(1);
  }

  previous(): void {
    this.requests.next(-1);
  }
}
