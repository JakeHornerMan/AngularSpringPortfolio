import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Project } from '../models/models';
import { environment } from 'src/environments/environment';

// Jake's ArtStation posts, as project-shaped windows. They live only in the content file (`artworks`, written by
// `npm run sync:art`) and StaticContentInterceptor answers this request from it. The Spring API has no such
// endpoint, so against the API this is just an empty list.
@Injectable({
  providedIn: 'root'
})
export class ArtworkService {

  domain: string | undefined;

  constructor(private httpClient: HttpClient) {
    this.domain = environment.apiBaseUrl;
  }

  getArtworks(): Observable<Project[]>{
    return this.httpClient.get<Project[]>(this.domain+'/artworks').pipe(catchError(() => of([])));
  }
}
