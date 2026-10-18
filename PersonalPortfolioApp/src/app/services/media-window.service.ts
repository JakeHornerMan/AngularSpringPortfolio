import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface MediaRequest {
  kind: 'video' | 'image';
  title: string;
  url: string;
  // The tile that was clicked: the media window grows out of it and shrinks back into it.
  source: HTMLElement;
}

// Video and image tiles ask for their media here; the single MediaWindowComponent (in the app shell)
// shows it.
@Injectable({ providedIn: 'root' })
export class MediaWindowService {
  readonly requests = new Subject<MediaRequest>();

  open(request: MediaRequest): void {
    this.requests.next(request);
  }
}

// Turns a YouTube / Vimeo link into an embed URL (autoplaying unless told not to), or returns null for a
// direct video file.
export function toEmbedUrl(url: string, autoplay = true): string | null {
  if (/\.(mp4|webm|ogg|mov)(\?|#|$)/i.test(url)) return null;
  const play = autoplay ? 1 : 0;
  const youTubeId = youTubeIdOf(url);
  if (youTubeId) return `https://www.youtube.com/embed/${youTubeId}?autoplay=${play}&playsinline=1&rel=0`;
  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}?autoplay=${play}`;
  return autoplay ? url + (url.includes('?') ? '&' : '?') + 'autoplay=1' : url;
}

export function youTubeIdOf(url: string): string | null {
  const match = url.match(/(?:youtube(?:-nocookie)?\.com\/(?:embed\/|shorts\/|watch\?(?:.*&)?v=)|youtu\.be\/)([\w-]{11})/);
  return match ? match[1] : null;
}
