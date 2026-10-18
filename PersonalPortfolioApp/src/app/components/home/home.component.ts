import { Component, OnInit } from '@angular/core';
import { WorkExperience } from 'src/app/models/models';
import { WorkExperienceService } from 'src/app/services/work-experience.service';


@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  currentWork?: WorkExperience;

  constructor(private workExperienceService: WorkExperienceService) {
  }

  ngOnInit(): void {
    window.scroll(0,0);
    this.getCurrentWork();
  }

  // The current job is the one with no end date; failing that, the one that started most recently.
  getCurrentWork(){
    this.workExperienceService.getAllWorkExperiences().subscribe((res: WorkExperience[])=>{
      if(res?.length){
        const byStart = [...res].sort((x, y) => +new Date(y.startDate) - +new Date(x.startDate));
        this.currentWork = byStart.find(work => !work.endDate) ?? byStart[0];
      }
    });
  }

}
