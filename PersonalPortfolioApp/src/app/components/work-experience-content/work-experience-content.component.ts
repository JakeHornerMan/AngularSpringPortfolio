import { Component, HostBinding, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Content, Project, WorkExperience } from 'src/app/models/models';
import { UserService } from 'src/app/services/user.service';
import { DeletePopupComponent } from '../delete-popup/delete-popup.component';
import { SecureService } from 'src/app/services/secure.service';

@Component({
  selector: 'app-work-experience-content',
  templateUrl: './work-experience-content.component.html',
  styleUrls: ['./work-experience-content.component.css']
})
export class WorkExperienceContentComponent implements OnInit {

  @Input() workExperience!: WorkExperience;
  contentList = new Array<Content>();
  liList = new Array<String>();
  @Input() @HostBinding('class.wide') open = false;

  constructor(private userService: UserService, 
    private router: Router,
    private service: SecureService,
    private dialog: MatDialog,) { }

  ngOnInit(): void {
    this.contentList = this.workExperience.contentList;
    this.sortContent();
  }

  sortContent(){
    this.contentList.sort((a, b) => {
      return a.position - b.position;
    });
    this.contentList = this.workExperience.contentList;
  }

  // An opened pocket spans the whole row of the pockets grid.
  toggle(){
    this.open = !this.open;
  }

  isUserLoggedIn(): boolean{
    return this.userService.isLoggedIn();
  }

  editWorkExperience(id: number){
    this.router.navigateByUrl('', { skipLocationChange: true }).then(() => {
      this.router.navigate(['/createWorkExperience/'+id]);
    });
  }

  removeWorkExperience(workExperienceId: number){
    let dialogRef = this.dialog.open(DeletePopupComponent, {
      autoFocus: false,
      height: '100vh',
      minWidth: '100vw',
    });

    dialogRef.afterClosed().subscribe(result =>{
      if(result){
        this.service.deleteWorkExperience(workExperienceId).subscribe((res: any)=>{
          console.log("this is now deleted");
          console.log(this.workExperience);
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
