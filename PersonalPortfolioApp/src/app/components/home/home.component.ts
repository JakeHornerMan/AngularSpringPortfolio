import { Component, OnInit } from '@angular/core';
import { Project, WorkExperience } from 'src/app/models/models';
import { WorkExperienceService } from 'src/app/services/work-experience.service';
import { ProjectService } from 'src/app/services/project.service';
import { newestFirst } from 'src/app/newest-first';

// Starred windows per space below the home page's main one.
const STARRED_PER_SPACE = 5;


@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  currentWork?: WorkExperience;
  // Everything starred, newest first: projects, plus past jobs (the current job is already up top).
  starred: { project?: Project; work?: WorkExperience }[] = [];
  private starredProjects: Project[] = [];
  private starredWork: WorkExperience[] = [];
  // Titles for the bounce field's spaces: space 0 is the main page, the rest hold the starred windows.
  spaceTitles: string[] = [];

  constructor(private workExperienceService: WorkExperienceService, private projectService: ProjectService) {
  }

  ngOnInit(): void {
    window.scroll(0,0);
    this.getCurrentWork();
    this.projectService.getAllProjects().subscribe((res: Project[])=>{
      this.starredProjects = (res ?? []).filter(project => project.staredProject);
      this.updateStarred();
    });
  }

  // The space a starred window bounces in: below the main one, STARRED_PER_SPACE to a space.
  starredSpace(index: number): number {
    return 1 + Math.floor(index / STARRED_PER_SPACE);
  }

  private updateStarred(){
    const items: { project?: Project; work?: WorkExperience; startDate: Date; endDate: Date }[] = [
      ...this.starredProjects.map(project => ({ project, startDate: project.startDate, endDate: project.endDate })),
      ...this.starredWork.filter(work => work !== this.currentWork).map(work => ({ work, startDate: work.startDate, endDate: work.endDate })),
    ];
    this.starred = newestFirst(items).map(({ project, work }) => ({ project, work }));
    const spaces = this.starred.length ? this.starredSpace(this.starred.length - 1) : 0;
    this.spaceTitles = ['', ...Array.from({ length: spaces }, () => 'starred')];
  }

  // The current job is the one with no end date; failing that, the one that started most recently.
  // Education (courses and apprenticeships) never counts as a job.
  getCurrentWork(){
    this.workExperienceService.getAllWorkExperiences().subscribe((res: WorkExperience[])=>{
      if(res?.length){
        const byStart = res.filter(work => !work.education).sort((x, y) => +new Date(y.startDate) - +new Date(x.startDate));
        this.currentWork = byStart.find(work => !work.endDate) ?? byStart[0];
        this.starredWork = res.filter(work => work.starred);
        this.updateStarred();
      }
    });
  }

}
