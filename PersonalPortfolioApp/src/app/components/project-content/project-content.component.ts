import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Content, Project } from 'src/app/models/models';
import { SecureService } from 'src/app/services/secure.service';
import { UserService } from 'src/app/services/user.service';
import { DeletePopupComponent } from '../delete-popup/delete-popup.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-project-content',
  templateUrl: './project-content.component.html',
  styleUrls: ['./project-content.component.css']
})
export class ProjectContentComponent implements OnInit {

  @Input() project!: Project;
  contentList = new Array<Content>();
  liList = new Array<String>();

  constructor(private userService: UserService, 
    private router: Router,
    private service: SecureService,
    private dialog: MatDialog,) {
    
  }

  ngOnInit(): void {
    window.scroll(0,0);
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
      this.router.navigate(['/createProject/'+id]);
    });
  }

  removeProject(projectId: number){
    let dialogRef = this.dialog.open(DeletePopupComponent, {
      autoFocus: false,
      height: '100vh',
      minWidth: '100vw',
    });

    dialogRef.afterClosed().subscribe(result =>{
      if(result){
        this.service.deleteProject(this.project.id).subscribe((res: any)=>{
          console.log("this is now deleted");
          console.log(this.project);
          window.location.reload();
          this.router.navigateByUrl('/home');
          
        },
        error => {
          console.log("Error Deleting!");
        });
      }
    })
  }

}
