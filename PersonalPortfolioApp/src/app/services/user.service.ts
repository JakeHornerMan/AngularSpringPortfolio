import { Injectable, Input } from '@angular/core';
import { User } from '../models/models';
import { CookieService } from 'ngx-cookie-service';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  // private user!: User;

  constructor(private cookie: CookieService) { }

  setUser(newUser: User): void {
    // this.user = newUser;
    this.setCookie(newUser);
  }

  getUser(): User {
    return this.getCookie();
  }

  isLoggedIn(): boolean {
    if(this.cookie.get("username")){
      return true;
    }
    return false;
  }

  setCookie(user: User): void {
    var encodeEmail = btoa(user.email);
    var encodePassword = btoa(user.password);
    this.cookie.set("username",encodeEmail);
    this.cookie.set("password",encodePassword);
  }

  getCookie(): User {
    let user = {} as User;
    var encodeEmail = this.cookie.get("username");
    var encodePassword = this.cookie.get("password");
    user.email = atob(encodeEmail);
    user.password = atob(encodePassword);
    return user;
  }

  clearCookies(): void {
    this.cookie.deleteAll();
  }
}
