import { HttpClientModule } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Interest, Project } from 'src/app/models/models';
import { InterestService } from 'src/app/services/interest.service';
import { ProjectService } from 'src/app/services/project.service';


@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  interestList = new Array<Interest>();
  projectList = new Array<Project>();

  constructor(private interestService:InterestService, private projectService:ProjectService) { 

  }

  ngOnInit(): void {
    this.getInterests();
    this.getProjects();
  }

  getInterests(){
    this.interestService.getAllInterests().subscribe((res: Interest[])=>{
      if(res){
        this.interestList = res;
      }
    });
  }

  getProjects(){
    this.projectService.getAllProjects().subscribe((res: Project[])=>{
      if(res){
        this.projectList = res;
        console.log(this.projectList);
      }
    });
  }

}
