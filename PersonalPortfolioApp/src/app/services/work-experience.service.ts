import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { WorkExperience } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class WorkExperienceService {

  domain: string | undefined;

  constructor(private httpClient: HttpClient) {
    this.domain = environment.apiBaseUrl;
  }

  getAllWorkExperiences(): Observable<WorkExperience[]>{
    return this.httpClient.get<WorkExperience[]>(this.domain+'/workExperience');
  }

  getWorkExperience(id: number): Observable<WorkExperience[]>{
    return this.httpClient.get<WorkExperience[]>(this.domain+'/workExperience/'+ id);
  }

  getWorkExperiencesByInterest(id: string): Observable<WorkExperience[]>{
    return this.httpClient.get<WorkExperience[]>(this.domain+'/workExperience/interest/'+ id);
  }
}
