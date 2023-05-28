import { Component, Input, OnInit } from '@angular/core';
import { Content, Project } from 'src/app/models/models';

@Component({
  selector: 'app-project-content',
  templateUrl: './project-content.component.html',
  styleUrls: ['./project-content.component.css']
})
export class ProjectContentComponent implements OnInit {

  @Input() project!: Project;
  contentList = new Array<Content>();
  liList = new Array<String>();

  constructor() {
    
  }

  ngOnInit(): void {
    this.contentList = this.project.contentList;
    this.sortContent();
    this.liList = this.project.mainPoints.split('&');
  }

  sortContent(){
    this.contentList.sort((a, b) => {
      return a.position - b.position;
    });
    this.contentList = this.project.contentList;
  }

}
