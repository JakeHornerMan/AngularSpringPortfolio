import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/internal/Observable';
import { Project } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {

  constructor(private httpClient: HttpClient) { }

  getAllProjects(): Observable<Project[]>{
    return this.httpClient.get<Project[]>('http://localhost:8080/projects');
  }

  getProject(id: number): Observable<Project[]>{
    return this.httpClient.get<Project[]>('http://localhost:8080/projects/'+ id);
  }

  saveProject(interest: Project): Observable<Project[]>{
    return this.httpClient.get<Project[]>('http://localhost:8080/projects/save/'+ interest);
  }

  deleteProject(id: number): Observable<Project[]>{
    return this.httpClient.get<Project[]>('http://localhost:8080/projects/delete/'+ id);
  }
}
