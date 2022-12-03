import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/internal/Observable';
import { Project } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {

  constructor(private httpClient: HttpClient) { }

  getAllInterests(): Observable<Project[]>{
    return this.httpClient.get<Project[]>('http://localhost:8080/interests');
  }

  getIntrest(id: number): Observable<Project[]>{
    return this.httpClient.get<Project[]>('http://localhost:8080/interests/'+ id);
  }

  saveInterest(interest: Project): Observable<Project[]>{
    return this.httpClient.get<Project[]>('http://localhost:8080/interests/save/'+ interest);
  }

  deleteInterest(id: number): Observable<Project[]>{
    return this.httpClient.get<Project[]>('http://localhost:8080/interests/delete/'+ id);
  }
}
