import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Interest } from '../models/models';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class InterestService {

  domain: string | undefined;

  constructor(private httpClient: HttpClient) {
    this.domain = environment.apiBaseUrl;
  }

  getAllInterests(): Observable<Interest[]>{
    return this.httpClient.get<Interest[]>(this.domain+'/interests');
  }

  getIntrest(id: number): Observable<Interest[]>{
    return this.httpClient.get<Interest[]>(this.domain+'/interests/'+ id);
  }

  saveInterest(interest: Interest): Observable<Interest>{
    return this.httpClient.post<Interest>(this.domain+'/interests/save', interest);
  }

  deleteInterest(id: number): Observable<Interest[]>{
    return this.httpClient.get<Interest[]>(this.domain+'/interests/delete/'+ id);
  }


}


