import { HttpClient, HttpHeaders, HttpStatusCode } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Interest, Project, User, WorkExperience } from '../models/models';
import { UserService } from './user.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SecureService {

  domain: string | undefined;

  constructor(private httpClient: HttpClient, private userService: UserService) {
    this.domain = environment.apiBaseUrl;
  }

  login(user: User): Observable<any>{
    return this.httpClient.post<any>(this.domain+'/login', user);
  }

  secure(): Observable<String>{
    let user = this.userService.getUser();
    const httpOptions = {
      headers: new HttpHeaders(
        {Authorization: 'Basic ' + btoa(user.email+':'+user.password)}
      ),
      responseType: 'text'
    };
    const headers = new HttpHeaders({Authorization: 'Basic ' + btoa('JakeDev:jG2s--dV')});
    return this.httpClient.get<String>(this.domain+'/secure' ,{headers});
  }

  saveInterest(interest: Interest): Observable<Interest>{
    let user = this.userService.getUser();
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Basic ' + btoa(user.email+':'+user.password)});
    let options = { headers: headers };
    return this.httpClient.post<Interest>(this.domain+'/interests/save', interest, options);
  }

  saveProject(project: Project): Observable<Project>{
    let user = this.userService.getUser();
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Basic ' + btoa(user.email+':'+user.password)});
    let options = { headers: headers };
    return this.httpClient.post<Project>(this.domain+'/projects/save', project, options);
  }

  updateProject(project: Project): Observable<Project>{
    let user = this.userService.getUser();
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Basic ' + btoa(user.email+':'+user.password)});
    let options = { headers: headers };
    return this.httpClient.put<Project>(this.domain+'/projects/update', project, options);
  }

  saveContentsofProject(project: Project) {
    let user = this.userService.getUser();
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Basic ' + btoa(user.email+':'+user.password)});
    let options = { headers: headers };
    return this.httpClient.post<Project>(this.domain+'/projects/contents/save', project, options);
  }

  saveWorkExperience(workExperience: WorkExperience): Observable<WorkExperience>{
    let user = this.userService.getUser();
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Basic ' + btoa(user.email+':'+user.password)});
    let options = { headers: headers };
    return this.httpClient.post<WorkExperience>(this.domain+'/workExperience/save', workExperience, options);
  }

  updateWorkExperience(workExperience: WorkExperience): Observable<WorkExperience>{
    let user = this.userService.getUser();
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Basic ' + btoa(user.email+':'+user.password)});
    let options = { headers: headers };
    return this.httpClient.put<WorkExperience>(this.domain+'/workExperience/update', workExperience, options);
  }

}
