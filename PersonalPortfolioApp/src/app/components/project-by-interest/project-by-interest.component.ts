import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Project } from 'src/app/models/models';
import { ProjectService } from 'src/app/services/project.service';

@Component({
  selector: 'app-project-by-interest',
  templateUrl: './project-by-interest.component.html',
  styleUrls: ['./project-by-interest.component.css']
})
export class ProjectByInterestComponent implements OnInit {

  id!: string;
  projectList = new Array<Project>();

  constructor(private activatedroute: ActivatedRoute,
    private projectService: ProjectService) {
    this.activatedroute.paramMap.subscribe(paramMap => { 
      //@ts-ignore
      this.id = paramMap.get('id'); 
    });
    console.log(this.id);
  }

  ngOnInit(): void {
    this.projectService.getProjectsByInterest(this.id).subscribe((res: any)=>{
      console.log(res);
      this.projectList = res;
    });
  }

}
