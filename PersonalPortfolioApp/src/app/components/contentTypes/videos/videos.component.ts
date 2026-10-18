import { Component, Input, OnInit } from '@angular/core';
import { Content } from 'src/app/models/models';
import { VideoWindowService, youTubeIdOf } from 'src/app/services/video-window.service';

@Component({
  selector: 'app-videos',
  templateUrl: './videos.component.html',
  styleUrls: ['./videos.component.css']
})
export class VideosComponent implements OnInit {

  @Input() content!: Content;

  thumbnail: string | null = null;

  paragraphList = new Array<String>();

  constructor(private videoWindow: VideoWindowService) {

  }

  ngOnInit(): void {
    const youTubeId = youTubeIdOf(this.content.contentUrl || '');
    this.thumbnail = youTubeId ? `https://i.ytimg.com/vi/${youTubeId}/hqdefault.jpg` : null;
    if(!this.isEmpty(this.content.contentParagraph)) this.paragraphList = this.content.contentParagraph.split('<?>');
  }

  play(tile: HTMLElement): void {
    this.videoWindow.open({ title: this.content.contentTitle || 'Video', url: this.content.contentUrl, source: tile });
  }

  isEmpty(string: string): boolean {
    if(string === "" || string === '' || string === undefined || string === null){
      return true;
    }
    return false;
  }

}
