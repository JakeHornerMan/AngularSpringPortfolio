import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { UserService } from './services/user.service';
;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  public innerWidth: any;

  constructor(private userService: UserService){}

  ngOnInit(){
    // this.innerWidth = window.innerWidth;
    // console.log(this.innerWidth);
  }

  isNotMobile(): boolean{
    if(window.innerWidth < 700){
      return false;
    }
    return true;
  }

  isUserLoggedIn(): boolean{
    return this.userService.isLoggedIn();
  }

}
