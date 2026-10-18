import { ChangeDetectorRef, Component, ElementRef, HostListener, OnDestroy, ViewChild } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Subscription } from 'rxjs';
import { VideoRequest, VideoWindowService, toEmbedUrl } from 'src/app/services/video-window.service';
import { CLOSE_MS, OPEN_MS, flip, layoutBox, rectBox, shrinkInto } from 'src/app/window-motion';

// A window of its own for playing a video. It grows out of the clicked video tile, plays straight
// away, and shrinks back into the tile when closed.
@Component({
  selector: 'app-video-window',
  templateUrl: './video-window.component.html',
  styleUrls: ['./video-window.component.css']
})
export class VideoWindowComponent implements OnDestroy {

  video: VideoRequest | null = null;
  embedUrl: SafeResourceUrl | null = null;
  fileUrl: string | null = null;
  private closing = false;
  private pendingOpen = false;
  private windowEl?: HTMLElement;
  private subscription: Subscription;

  @ViewChild('win') set win(ref: ElementRef<HTMLElement> | undefined) {
    this.windowEl = ref?.nativeElement;
    if (this.windowEl && this.pendingOpen) {
      this.pendingOpen = false;
      const el = this.windowEl;
      const source = this.video!.source;
      flip(el, rectBox(source), layoutBox(el), 'translate3d(0px, 0px, 0)', OPEN_MS);
      el.querySelector<HTMLElement>('.window-open')?.focus({ preventScroll: true });
    }
  }

  constructor(service: VideoWindowService, private sanitizer: DomSanitizer, private changes: ChangeDetectorRef) {
    this.subscription = service.requests.subscribe(request => this.show(request));
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  private show(request: VideoRequest): void {
    if (this.closing) return;
    const embed = toEmbedUrl(request.url);
    this.embedUrl = embed ? this.sanitizer.bypassSecurityTrustResourceUrl(embed) : null;
    this.fileUrl = embed ? null : request.url;
    this.video = request;
    this.pendingOpen = true;
    this.changes.detectChanges();
  }

  @HostListener('document:keydown.escape')
  close(): void {
    const el = this.windowEl;
    if (!this.video || !el || this.closing) return;
    this.closing = true;
    const source = this.video.source;
    const done = () => {
      this.closing = false;
      this.video = null;
      this.embedUrl = this.fileUrl = null;
      this.changes.detectChanges();
      source.focus?.({ preventScroll: true });
    };
    // The tile may have gone (its window was closed); then just let the video window go.
    if (!source.isConnected) {
      done();
      return;
    }
    shrinkInto(el, layoutBox(el), rectBox(source), 'translate3d(0px, 0px, 0)', CLOSE_MS).then(done);
  }
}
