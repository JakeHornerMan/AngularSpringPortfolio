import { Component } from '@angular/core';
import { UserService } from './services/user.service';
import { OverlayScrollbarService } from './services/overlay-scrollbar.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  readonly year = new Date().getFullYear();

  constructor(private userService: UserService, overlayScrollbars: OverlayScrollbarService){
    overlayScrollbars.start();
  }

  isUserLoggedIn(): boolean{
    return this.userService.isLoggedIn();
  }

}
