import { ChangeDetectorRef, Component, ElementRef, HostListener, OnDestroy, ViewChild } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Subscription } from 'rxjs';
import { MediaRequest, MediaWindowService, toEmbedUrl } from 'src/app/services/media-window.service';
import { startBusyCursor } from 'src/app/cursors';
import { CLOSE_MS, OPEN_MS, flip, layoutBox, rectBox, shrinkInto } from 'src/app/window-motion';

// A window of its own for a video or an image. It grows out of the clicked tile (videos start playing
// straight away) and shrinks back into the tile when closed.
@Component({
  selector: 'app-media-window',
  templateUrl: './media-window.component.html',
  styleUrls: ['./media-window.component.css']
})
export class MediaWindowComponent implements OnDestroy {

  media: MediaRequest | null = null;
  embedUrl: SafeResourceUrl | null = null;
  fileUrl: string | null = null;
  imageUrl: string | null = null;
  // An embedded player is still loading: a cover over it keeps the hourglass showing.
  frameLoading = false;
  private stopBusyCursor?: () => void;
  private closing = false;
  private pendingOpen = false;
  private windowEl?: HTMLElement;
  private subscription: Subscription;

  @ViewChild('win') set win(ref: ElementRef<HTMLElement> | undefined) {
    this.windowEl = ref?.nativeElement;
    if (this.windowEl && this.pendingOpen) {
      this.pendingOpen = false;
      const el = this.windowEl;
      flip(el, rectBox(this.media!.source), layoutBox(el), 'translate3d(0px, 0px, 0)', OPEN_MS).then(() => {
        // Still loading once it has grown: keep the hourglass turning until the player is in.
        if (this.frameLoading && !this.stopBusyCursor) this.stopBusyCursor = startBusyCursor();
      });
      el.querySelector<HTMLElement>('.window-open')?.focus({ preventScroll: true });
    }
  }

  constructor(service: MediaWindowService, private sanitizer: DomSanitizer, private changes: ChangeDetectorRef) {
    this.subscription = service.requests.subscribe(request => this.show(request));
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    this.frameLoaded();
  }

  frameLoaded(): void {
    this.frameLoading = false;
    this.stopBusyCursor?.();
    this.stopBusyCursor = undefined;
  }

  private show(request: MediaRequest): void {
    if (this.closing) return;
    // Opening another tile while one is showing swaps it straight in.
    this.media = null;
    this.changes.detectChanges();
    this.embedUrl = this.fileUrl = this.imageUrl = null;
    if (request.kind === 'image') {
      this.imageUrl = request.url;
    } else {
      const embed = toEmbedUrl(request.url);
      this.embedUrl = embed ? this.sanitizer.bypassSecurityTrustResourceUrl(embed) : null;
      this.fileUrl = embed ? null : request.url;
    }
    this.frameLoaded();
    this.frameLoading = !!this.embedUrl;
    this.media = request;
    this.pendingOpen = true;
    this.changes.detectChanges();
  }

  @HostListener('document:keydown.escape')
  close(): void {
    const el = this.windowEl;
    if (!this.media || !el || this.closing) return;
    this.closing = true;
    const source = this.media.source;
    this.frameLoaded();
    const done = () => {
      this.closing = false;
      this.media = null;
      this.embedUrl = this.fileUrl = this.imageUrl = null;
      this.changes.detectChanges();
      source.focus?.({ preventScroll: true });
    };
    // The tile may have gone (its window was closed); then just let this window go.
    if (!source.isConnected) {
      done();
      return;
    }
    shrinkInto(el, layoutBox(el), rectBox(source), 'translate3d(0px, 0px, 0)', CLOSE_MS).then(done);
  }
}
