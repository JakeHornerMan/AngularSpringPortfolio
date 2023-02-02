import { Component, Input, OnInit } from '@angular/core';
import { Content, Project } from 'src/app/models/models';

@Component({
  selector: 'app-images',
  templateUrl: './images.component.html',
  styleUrls: ['./images.component.css']
})
export class ImagesComponent implements OnInit {

  @Input() content!: Content;
  paragraphList = new Array<String>();

  constructor() { }

  ngOnInit(): void {
    this.paragraphList = this.content.contentParagraph.split('<?>');
  }

}
