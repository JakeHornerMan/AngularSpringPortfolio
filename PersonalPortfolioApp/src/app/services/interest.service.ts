import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Interest } from '../models/interest';

@Injectable({
  providedIn: 'root'
})
export class InterestService {

  constructor(private httpClient: HttpClient) { }

  getAllInterests(): Observable<Interest[]>{
    return this.httpClient.get<Interest[]>('http://localhost:8080/interests');
  }

  getIntrest(id: number): Observable<Interest[]>{
    return this.httpClient.get<Interest[]>('http://localhost:8080/interests/'+ id);
  }

  saveInterest(interest: Interest): Observable<Interest[]>{
    return this.httpClient.get<Interest[]>('http://localhost:8080/interests/save/'+ interest);
  }

  deleteInterest(id: number): Observable<Interest[]>{
    return this.httpClient.get<Interest[]>('http://localhost:8080/interests/delete/'+ id);
  }


}


