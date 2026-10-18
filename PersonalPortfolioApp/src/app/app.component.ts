import { Component } from '@angular/core';
import { ResolveStart, Router } from '@angular/router';
import { UserService } from './services/user.service';
import { OverlayScrollbarService } from './services/overlay-scrollbar.service';
import { SpaceNavService } from './services/space-nav.service';
import { SectionTitleService } from './services/section-title.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  readonly year = new Date().getFullYear();

  constructor(private userService: UserService, overlayScrollbars: OverlayScrollbarService, private spaceNav: SpaceNavService,
    readonly sectionTitle: SectionTitleService, router: Router){
    // Back to "Jake Horner" for each new page (ResolveStart comes after the curtain has covered the old one);
    // section pages then set their own name.
    router.events.subscribe(e => {
      if (e instanceof ResolveStart) sectionTitle.reset();
    });
    overlayScrollbars.start();
  }

  // The arrows beside the dock slide the page to the next / previous space of windows.
  nextSpace(): void {
    this.spaceNav.next();
  }

  previousSpace(): void {
    this.spaceNav.previous();
  }

  isUserLoggedIn(): boolean{
    return this.userService.isLoggedIn();
  }

}
