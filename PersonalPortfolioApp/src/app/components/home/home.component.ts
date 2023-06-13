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
  staredProjectList = new Array<Project>();

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
        this.sortLists(res);
        
        this.projectList.sort((x, y) => +new Date(y.endDate) - +new Date(x.endDate));
        this.staredProjectList.sort((x, y) => +new Date(y.endDate) - +new Date(x.endDate));
      }
    });
  }

  sortLists(arr: Project[]) {
    arr.forEach((item) => {
      if(item.staredProject){
        this.staredProjectList.push(item);
      }
      else{
        this.projectList.push(item);
      }
    });
  }

}
