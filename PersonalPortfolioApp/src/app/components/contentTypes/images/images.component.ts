import { Component, Input, OnInit } from '@angular/core';
import { Content, Project } from 'src/app/models/models';
import { DomSanitizer, SafeUrl, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-images',
  templateUrl: './images.component.html',
  styleUrls: ['./images.component.css']
})
export class ImagesComponent implements OnInit {

  @Input() content!: Content;
  paragraphList = new Array<String>();
  contentUrl!: SafeResourceUrl;

  constructor(private sanitizer: DomSanitizer) { }

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
