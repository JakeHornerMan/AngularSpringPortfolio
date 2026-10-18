import { Component } from '@angular/core';
import { UserService } from './services/user.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  readonly year = new Date().getFullYear();

  constructor(private userService: UserService){}

  isUserLoggedIn(): boolean{
    return this.userService.isLoggedIn();
  }

}
