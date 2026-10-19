import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { WorkExperience } from 'src/app/models/models';
import { UserService } from 'src/app/services/user.service';
import { WorkExperienceService } from 'src/app/services/work-experience.service';
import { SectionTitleService } from 'src/app/services/section-title.service';
import { newestFirst } from 'src/app/newest-first';

@Component({
  selector: 'app-view-work-experience',
  templateUrl: './view-work-experience.component.html',
  styleUrls: ['./view-work-experience.component.css']
})
export class ViewWorkExperienceComponent implements OnInit {

  workExperienceList = new Array<WorkExperience>();

  constructor(private workExperienceService: WorkExperienceService, 
    private router: Router,
    private userService: UserService,
    private sectionTitle: SectionTitleService,) { }

  ngOnInit(): void {
    this.sectionTitle.set('Work and education');
    window.scroll(0,0);
    this.workExperienceService.getAllWorkExperiences().subscribe((res: any)=>{
      // console.log(res);
      this.workExperienceList = newestFirst(res ?? []);
    });
  }

  

}
