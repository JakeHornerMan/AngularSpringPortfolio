import { HttpBackend, HttpClient, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

interface Content {
  interests: any[];
  projects: any[];
  workExperiences: any[];
  artworks?: any[];
}

const has = (csv: string | undefined, id: string) => (csv || '').split(',').includes(id);

// The API's read endpoints, answered from the content file instead.
const ROUTES: [RegExp, (d: Content, m: RegExpMatchArray) => unknown][] = [
  [/^\/interests\/?$/, d => d.interests],
  [/^\/interests\/(\d+)$/, (d, m) => d.interests.find(i => i.id == +m[1])],
  [/^\/projects\/?$/, d => d.projects],
  [/^\/projects\/interest\/(\d+)$/, (d, m) => d.projects.filter(p => has(p.linkedInterests, m[1]))],
  [/^\/projects\/(\d+)$/, (d, m) => d.projects.find(p => p.id == +m[1])],
  [/^\/workExperience\/?$/, d => d.workExperiences],
  [/^\/workExperience\/interest\/(\d+)$/, (d, m) => d.workExperiences.filter(w => has(w.linkedInterests, m[1]))],
  [/^\/workExperience\/(\d+)$/, (d, m) => d.workExperiences.find(w => w.id == +m[1])],
  // Only in the content file: the ArtStation posts (see ArtworkService).
  [/^\/artworks\/?$/, d => d.artworks ?? []],
];

// When `environment.contentUrl` is set (the static Firebase build), GETs to the API are served from that
// JSON file (jakedev-content.json in the repo), so the site needs no backend. Everything else passes through.
@Injectable()
export class StaticContentInterceptor implements HttpInterceptor {
  private content?: Observable<Content>;

  // HttpBackend skips the interceptors, so fetching the file doesn't loop back through this one.
  constructor(private backend: HttpBackend) { }

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const url = environment.contentUrl;
    if (!url || req.method !== 'GET' || !req.url.startsWith(environment.apiBaseUrl)) return next.handle(req);
    const path = req.url.slice(environment.apiBaseUrl.length).split('?')[0];
    const route = ROUTES.map(([re, fn]) => [path.match(re), fn] as const).find(([m]) => m);
    if (!route) return next.handle(req);
    this.content ??= new HttpClient(this.backend).get<Content>(url).pipe(shareReplay(1));
    const [m, fn] = route;
    return this.content.pipe(map(d => new HttpResponse({ status: 200, url: req.url, body: fn(d, m!) ?? null })));
  }
}
