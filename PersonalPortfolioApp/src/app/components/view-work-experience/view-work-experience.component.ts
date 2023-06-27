import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { WorkExperience } from 'src/app/models/models';
import { UserService } from 'src/app/services/user.service';
import { WorkExperienceService } from 'src/app/services/work-experience.service';

@Component({
  selector: 'app-view-work-experience',
  templateUrl: './view-work-experience.component.html',
  styleUrls: ['./view-work-experience.component.css']
})
export class ViewWorkExperienceComponent implements OnInit {

  workExperienceList = new Array<WorkExperience>();

  constructor(private workExperienceService: WorkExperienceService, 
    private router: Router,
    private userService: UserService,) { }

  ngOnInit(): void {
    this.workExperienceService.getAllWorkExperiences().subscribe((res: any)=>{
      // console.log(res);
      this.workExperienceList = res;
    });
  }

  editWorkExperience(id: number){
    this.router.navigateByUrl('', { skipLocationChange: true }).then(() => {
      this.router.navigate(['/createWorkExperience/'+id]);
    });
  }

  isUserLoggedIn(): boolean{
    return this.userService.isLoggedIn();
  }

}
