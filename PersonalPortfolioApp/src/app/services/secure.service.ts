import { HttpClient, HttpHeaders, HttpStatusCode } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Interest, Project, User } from '../models/models';
import { UserService } from './user.service';

@Injectable({
  providedIn: 'root'
})
export class SecureService {

  constructor(private httpClient: HttpClient, private userService: UserService) { }

  login(user: User): Observable<any>{
    return this.httpClient.post<any>('http://localhost:8080/login', user);
  }

  secure(): Observable<String>{
    let user = this.userService.getUser();
    const httpOptions = {
      headers: new HttpHeaders(
        {Authorization: 'Basic ' + btoa(user.email+':'+user.password)}
      ),
      responseType: 'text'
    };
    // const headers = new HttpHeaders({'JakeDev:jG2s--dV'});
    const headers = new HttpHeaders({Authorization: 'Basic ' + btoa('JakeDev:jG2s--dV')});
    // headers.append('Access-Control-Allow-Origin', '*');
    return this.httpClient.get<String>('http://localhost:8080/secure' ,{headers});
  }

  saveInterest(interest: Interest): Observable<Interest>{
    let user = this.userService.getUser();
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Basic ' + btoa(user.email+':'+user.password)});
    let options = { headers: headers };
    return this.httpClient.post<Interest>('http://localhost:8080/interests/save', interest, options);
  }

  saveProject(project: Project): Observable<Project>{
    let user = this.userService.getUser();
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Basic ' + btoa(user.email+':'+user.password)});
    let options = { headers: headers };
    return this.httpClient.post<Project>('http://localhost:8080/projects/save', project, options);
  }


}
