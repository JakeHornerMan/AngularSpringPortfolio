import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

// Tracks in-flight HTTP requests so the intro sweep can wait for the first page's data.
@Injectable({
  providedIn: 'root'
})
export class LoadingService {

  readonly pending$ = new BehaviorSubject<number>(0);

  get pending(): number {
    return this.pending$.value;
  }

  start(): void {
    this.pending$.next(this.pending$.value + 1);
  }

  done(): void {
    this.pending$.next(Math.max(0, this.pending$.value - 1));
  }
}
