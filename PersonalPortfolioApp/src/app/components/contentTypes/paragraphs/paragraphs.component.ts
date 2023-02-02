import { Component, Input, OnInit } from '@angular/core';
import { Content } from 'src/app/models/models';

@Component({
  selector: 'app-paragraphs',
  templateUrl: './paragraphs.component.html',
  styleUrls: ['./paragraphs.component.css']
})
export class ParagraphsComponent implements OnInit {

  @Input() content!: Content;
  paragraphList = new Array<String>();

  constructor() { 

  }

  ngOnInit(): void {
    this.paragraphList = this.content.contentParagraph.split('<?>');
  }

}
