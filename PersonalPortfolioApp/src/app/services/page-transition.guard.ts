import { Injectable } from '@angular/core';
import { CanActivateChild } from '@angular/router';
import { PageTransitionService } from './page-transition.service';

// Holds every in-app navigation until the ink curtain has covered the current page.
@Injectable({
  providedIn: 'root'
})
export class PageTransitionGuard implements CanActivateChild {

  constructor(private transition: PageTransitionService) { }

  canActivateChild(): Promise<boolean> {
    return this.transition.beforeNavigate();
  }
}
