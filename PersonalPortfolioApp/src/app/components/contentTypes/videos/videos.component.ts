import { Component, Input, OnInit } from '@angular/core';
import { DomSanitizer, SafeUrl, SafeResourceUrl } from '@angular/platform-browser';
import { Content } from 'src/app/models/models';

@Component({
  selector: 'app-videos',
  templateUrl: './videos.component.html',
  styleUrls: ['./videos.component.css']
})
export class VideosComponent implements OnInit {

  @Input() content!: Content;

  contentUrl!: SafeResourceUrl;

  paragraphList = new Array<String>();

  constructor(private sanitizer: DomSanitizer) { 
    
  }

  ngOnInit(): void {
    this.contentUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.content.contentUrl);
    if(!this.isEmpty(this.content.contentParagraph)) this.paragraphList = this.content.contentParagraph.split('<?>');
  }

  isEmpty(string: string): boolean {
    if(string === "" || string === '' || string === undefined || string === null){
      return true;
    }
    return false;
  }

}
