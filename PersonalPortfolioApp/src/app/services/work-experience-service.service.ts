import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { WorkExperience } from '../models/models';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WorkExperienceServiceService {

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
