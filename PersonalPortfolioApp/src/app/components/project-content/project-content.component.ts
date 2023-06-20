import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Content, Project } from 'src/app/models/models';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-project-content',
  templateUrl: './project-content.component.html',
  styleUrls: ['./project-content.component.css']
})
export class ProjectContentComponent implements OnInit {

  @Input() project!: Project;
  contentList = new Array<Content>();
  liList = new Array<String>();

  constructor(private userService: UserService, private router: Router,) {
    
  }

  ngOnInit(): void {
    this.contentList = this.project.contentList;
    this.sortContent();
    if(this.project.mainPoints && this.project.mainPoints.includes('&')){
      this.liList = this.project.mainPoints.split('&');
    }
  }

  sortContent(){
    this.contentList.sort((a, b) => {
      return a.position - b.position;
    });
    this.contentList = this.project.contentList;
  }

  isUserLoggedIn(): boolean{
    return this.userService.isLoggedIn();
  }

  editProject(id: number){
    this.router.navigateByUrl('', { skipLocationChange: true }).then(() => {
      this.router.navigate(['/createPage/'+id]);
    });
  }

}
