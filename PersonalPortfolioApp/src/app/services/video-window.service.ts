import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface VideoRequest {
  title: string;
  url: string;
  // The tile that was clicked: the video window grows out of it and shrinks back into it.
  source: HTMLElement;
}

// Video tiles ask for a video here; the single VideoWindowComponent (in the app shell) plays it.
@Injectable({ providedIn: 'root' })
export class VideoWindowService {
  readonly requests = new Subject<VideoRequest>();

  open(request: VideoRequest): void {
    this.requests.next(request);
  }
}

// Turns a YouTube / Vimeo link into an autoplaying embed URL, or returns null for a direct video file.
export function toEmbedUrl(url: string): string | null {
  if (/\.(mp4|webm|ogg|mov)(\?|#|$)/i.test(url)) return null;
  const youTubeId = youTubeIdOf(url);
  if (youTubeId) return `https://www.youtube.com/embed/${youTubeId}?autoplay=1&playsinline=1&rel=0`;
  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}?autoplay=1`;
  return url + (url.includes('?') ? '&' : '?') + 'autoplay=1';
}

export function youTubeIdOf(url: string): string | null {
  const match = url.match(/(?:youtube(?:-nocookie)?\.com\/(?:embed\/|shorts\/|watch\?(?:.*&)?v=)|youtu\.be\/)([\w-]{11})/);
  return match ? match[1] : null;
}
