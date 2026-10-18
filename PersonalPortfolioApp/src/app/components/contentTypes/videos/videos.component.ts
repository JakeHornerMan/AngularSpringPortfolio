import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { watchDesktop } from 'src/app/layout-mode';
import { Content } from 'src/app/models/models';
import { MediaWindowService, toEmbedUrl, youTubeIdOf } from 'src/app/services/media-window.service';

@Component({
  selector: 'app-videos',
  templateUrl: './videos.component.html',
  styleUrls: ['./videos.component.css']
})
export class VideosComponent implements OnInit, OnDestroy {

  @Input() content!: Content;

  thumbnail: string | null = null;
  // Phones and tablets play the video inline instead of in a window.
  inline = false;
  embedUrl: SafeResourceUrl | null = null;

  paragraphList = new Array<String>();
  private stopWatching = () => {};

  constructor(private mediaWindow: MediaWindowService, private sanitizer: DomSanitizer) {

  }

  ngOnInit(): void {
    const url = this.content.contentUrl || '';
    const youTubeId = youTubeIdOf(url);
    this.thumbnail = youTubeId ? `https://i.ytimg.com/vi/${youTubeId}/hqdefault.jpg` : null;
    const embed = toEmbedUrl(url, false);
    this.embedUrl = embed ? this.sanitizer.bypassSecurityTrustResourceUrl(embed) : null;
    if(!this.isEmpty(this.content.contentParagraph)) this.paragraphList = this.content.contentParagraph.split('<?>');
    this.stopWatching = watchDesktop(isDesktop => this.inline = !isDesktop);
  }

  ngOnDestroy(): void {
    this.stopWatching();
  }

  play(tile: HTMLElement): void {
    this.mediaWindow.open({ kind: 'video', title: this.content.contentTitle || 'Video', url: this.content.contentUrl, source: tile });
  }

  // Plays a video file's tile preview while the tile is hovered.
  previewClip(event: Event, playing: boolean): void {
    const clip = (event.currentTarget as HTMLElement).querySelector('video');
    if (!clip) return;
    if (playing) clip.play().catch(() => {});
    else clip.pause();
  }

  isEmpty(string: string): boolean {
    if(string === "" || string === '' || string === undefined || string === null){
      return true;
    }
    return false;
  }

}
