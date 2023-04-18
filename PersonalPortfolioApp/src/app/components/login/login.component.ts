import { HttpStatusCode } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { User } from 'src/app/models/models';
import { SecureService } from 'src/app/services/secure.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  user = {} as User;

  loginForm = new FormGroup({
    email: new FormControl(''),
    password: new FormControl(''),
  });
  
  constructor(private service: SecureService, private router: Router, private userService: UserService) { }

  ngOnInit(): void {
  }

  login(): void {
    this.user.email = this.loginForm.controls['email'].value;
    this.user.password = this.loginForm.controls['password'].value;
    // console.log(this.user);
    this.service.login(this.user).subscribe((res: any)=>{
      console.log(res);
      if(res.email == this.user.email && res.password == this.user.password){
        this.userService.setUser(this.user);
        this.router.navigate(['createPage']);
      }
      else{
        console.log('Invalid!');
      }
    });
  }

}
