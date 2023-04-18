import { Injectable, Input } from '@angular/core';
import { User } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private user!: User;

  constructor() { }

  setUser(newUser: User): void {
    this.user = newUser;
  }

  getUser(): User {
    return this.user;
  }

  isLoggedIn(): boolean {
    if(this.getUser() == null){
      return false;
    }
    return true;
  }
}
