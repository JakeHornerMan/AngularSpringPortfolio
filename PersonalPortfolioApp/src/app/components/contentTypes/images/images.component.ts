import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { watchDesktop } from 'src/app/layout-mode';
import { Content } from 'src/app/models/models';
import { MediaWindowService } from 'src/app/services/media-window.service';

@Component({
  selector: 'app-images',
  templateUrl: './images.component.html',
  styleUrls: ['./images.component.css']
})
export class ImagesComponent implements OnInit, OnDestroy {

  @Input() content!: Content;
  paragraphList = new Array<String>();
  // Phones and tablets show the image inline instead of in a window.
  inline = false;
  private stopWatching = () => {};

  constructor(private mediaWindow: MediaWindowService) { }

  ngOnInit(): void {
    if(!this.isEmpty(this.content.contentParagraph)) this.paragraphList = this.content.contentParagraph.split('<?>');
    this.stopWatching = watchDesktop(isDesktop => this.inline = !isDesktop);
  }

  ngOnDestroy(): void {
    this.stopWatching();
  }

  view(tile: HTMLElement): void {
    this.mediaWindow.open({ kind: 'image', title: this.content.contentTitle || 'Image', url: this.content.contentUrl, source: tile });
  }

  isEmpty(string: string): boolean {
    if(string === "" || string === '' || string === undefined || string === null){
      return true;
    }
    return false;
  }

}
