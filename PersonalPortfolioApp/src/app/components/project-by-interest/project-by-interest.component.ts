import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Project } from 'src/app/models/models';
import { ProjectService } from 'src/app/services/project.service';

// Matches the interests seeded in V1__static-conetnet-for-interests.sql and the nav dock.
const INTEREST_TITLES: { [id: string]: string } = {
  '1': 'Game development',
  '2': 'Art works',
  '3': 'Software development',
};

@Component({
  selector: 'app-project-by-interest',
  templateUrl: './project-by-interest.component.html',
  styleUrls: ['./project-by-interest.component.css']
})
export class ProjectByInterestComponent implements OnInit {

  id!: string;
  title = 'Projects';
  loaded = false;
  projectList = new Array<Project>();

  constructor(private activatedroute: ActivatedRoute,
    private projectService: ProjectService) { }

  ngOnInit(): void {
    // The component is reused when moving between interests, so reload on every id change.
    this.activatedroute.paramMap.subscribe(paramMap => {
      this.id = paramMap.get('id') ?? '';
      this.title = INTEREST_TITLES[this.id] ?? 'Projects';
      this.loaded = false;
      this.projectList = [];
      window.scroll(0,0);
      this.projectService.getProjectsByInterest(this.id).subscribe((res: Project[])=>{
        this.projectList = res ?? [];
        this.loaded = true;
      });
    });
  }

}
