import { Component, Input, OnInit } from '@angular/core';
import { Project } from 'src/app/models/models';

@Component({
  selector: 'app-project-content',
  templateUrl: './project-content.component.html',
  styleUrls: ['./project-content.component.css']
})
export class ProjectContentComponent implements OnInit {

  @Input() project!: Project;

  constructor() { }

  ngOnInit(): void {
  }

}
