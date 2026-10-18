import { Component, HostBinding, Input, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Content, Project } from 'src/app/models/models';
import { SecureService } from 'src/app/services/secure.service';
import { UserService } from 'src/app/services/user.service';
import { DeletePopupComponent } from '../delete-popup/delete-popup.component';
import { MatDialog } from '@angular/material/dialog';
import { OpenableWindow, OpenWindowService } from 'src/app/services/open-window.service';

@Component({
  selector: 'app-project-content',
  templateUrl: './project-content.component.html',
  styleUrls: ['./project-content.component.css']
})
export class ProjectContentComponent implements OnInit, OnDestroy, OpenableWindow {

  @Input() project!: Project;
  contentList = new Array<Content>();
  liList = new Array<String>();
  @Input() @HostBinding('class.wide') open = false;

  constructor(private userService: UserService, 
    private router: Router,
    private service: SecureService,
    private dialog: MatDialog,
    private openWindows: OpenWindowService,) {
    
  }

  ngOnInit(): void {
    this.contentList = this.project.contentList;
    this.sortContent();
    if(this.project.mainPoints){
      this.liList = this.project.mainPoints.split('&').map(point => point.trim()).filter(point => point);
    }
  }

  // An opened pocket spans the whole row of the pockets grid.
  // Only one window opens at a time: trying to open this one while another is open just closes that one.
  toggle(){
    if (this.open) {
      this.close();
    } else if (this.openWindows.requestOpen(this)) {
      this.open = true;
    }
  }

  close(){
    this.open = false;
    this.openWindows.closed(this);
  }

  ngOnDestroy(): void {
    this.openWindows.closed(this);
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
          this.router.navigate(['home']);
          
        },
        error => {
          console.log("Error Deleting!");
        });
      }
    })
  }

}
