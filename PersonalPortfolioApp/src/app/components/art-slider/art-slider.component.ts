import { Component, HostListener, Input, OnChanges } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Content } from 'src/app/models/models';
import { toEmbedUrl } from 'src/app/services/media-window.service';

interface Slide {
  kind: 'image' | 'embed';
  url: string | SafeResourceUrl;
  title: string;
}

// An opened art window (an ArtStation post): its images and embeds (YouTube, Sketchfab) one at a time,
// with arrows, dots, the arrow keys and a swipe to move between them. Only the current slide is rendered,
// so a playing video stops when you move on.
@Component({
  selector: 'app-art-slider',
  templateUrl: './art-slider.component.html',
  styleUrls: ['./art-slider.component.css']
})
export class ArtSliderComponent implements OnChanges {

  @Input() content: Content[] = [];
  @Input() title = '';
  slides: Slide[] = [];
  index = 0;
  private swipeFrom: number | null = null;

  constructor(private sanitizer: DomSanitizer) { }

  ngOnChanges(): void {
    this.slides = this.content
      .filter(c => c.contentType === 'image' || c.contentType === 'video')
      .map(c => c.contentType === 'image'
        ? { kind: 'image', url: c.contentUrl, title: c.contentTitle }
        : { kind: 'embed', url: this.sanitizer.bypassSecurityTrustResourceUrl(toEmbedUrl(c.contentUrl, false) ?? c.contentUrl), title: c.contentTitle });
    this.index = 0;
  }

  go(step: number): void {
    const count = this.slides.length;
    this.index = (this.index + step + count) % count;
  }

  @HostListener('document:keydown', ['$event'])
  onKey(event: KeyboardEvent): void {
    if (event.key === 'ArrowLeft') this.go(-1);
    else if (event.key === 'ArrowRight') this.go(1);
  }

  onPointerDown(event: PointerEvent): void {
    this.swipeFrom = event.clientX;
  }

  onPointerUp(event: PointerEvent): void {
    if (this.swipeFrom === null) return;
    const moved = event.clientX - this.swipeFrom;
    this.swipeFrom = null;
    if (Math.abs(moved) > 40) this.go(moved < 0 ? 1 : -1);
  }
}
