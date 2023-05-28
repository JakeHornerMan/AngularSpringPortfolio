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

  constructor(private userService: UserService){}

  ngOnInit(){
    if(this.userService.isLoggedIn()){
      console.log("you are logged in!");
    }
    else{
      console.log("not logged in!");
    }
  }

}
