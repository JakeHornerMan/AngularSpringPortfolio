import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/internal/Observable';
import { Project } from '../models/models';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {

  domain: string | undefined;

  constructor(private httpClient: HttpClient) {
    this.domain = environment.apiBaseUrl;
  }

  getAllProjects(): Observable<Project[]>{
    return this.httpClient.get<Project[]>(this.domain+'/projects');
  }

  getProject(id: number): Observable<Project[]>{
    return this.httpClient.get<Project[]>(this.domain+'/projects/'+ id);
  }

  getProjectsByInterest(id: string): Observable<Project[]>{
    return this.httpClient.get<Project[]>(this.domain+'/projects/interest/'+ id);
  }

  saveProject(interest: Project): Observable<Project[]>{
    return this.httpClient.get<Project[]>(this.domain+'/projects/save/'+ interest);
  }

  deleteProject(id: number): Observable<Project[]>{
    return this.httpClient.get<Project[]>(this.domain+'/projects/delete/'+ id);
  }
}
