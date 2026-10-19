import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Project } from 'src/app/models/models';
import { ProjectService } from 'src/app/services/project.service';
import { SectionTitleService } from 'src/app/services/section-title.service';
import { newestFirst } from 'src/app/newest-first';
import { ArtworkService } from 'src/app/services/artwork.service';
import { PER_SPACE } from 'src/app/directives/bounce-field.directive';
import { forkJoin, of } from 'rxjs';

// Matches the interests seeded in V1__static-conetnet-for-interests.sql and the nav dock.
const INTEREST_TITLES: { [id: string]: string } = {
  '1': 'Game development',
  '2': 'Art works',
  '3': 'Software development',
};

// The art page also shows every ArtStation post, as small windows, 20 to a space.
const ART_INTEREST = '2';

@Component({
  selector: 'app-project-by-interest',
  templateUrl: './project-by-interest.component.html',
  styleUrls: ['./project-by-interest.component.css']
})
export class ProjectByInterestComponent implements OnInit {

  id!: string;
  title = 'Projects';
  loaded = false;
  projectList = new Array<Project>();
  artworks = new Array<Project>();
  readonly PER_SPACE = PER_SPACE;
  readonly ART_PER_SPACE = 20;

  constructor(private activatedroute: ActivatedRoute,
    private projectService: ProjectService,
    private artworkService: ArtworkService,
    private sectionTitle: SectionTitleService) { }

  ngOnInit(): void {
    // The component is reused when moving between interests, so reload on every id change.
    this.activatedroute.paramMap.subscribe(paramMap => {
      this.id = paramMap.get('id') ?? '';
      this.title = INTEREST_TITLES[this.id] ?? 'Projects';
      this.sectionTitle.set(this.title);
      this.loaded = false;
      this.projectList = [];
      this.artworks = [];
      window.scroll(0,0);
      forkJoin([
        this.projectService.getProjectsByInterest(this.id),
        this.id === ART_INTEREST ? this.artworkService.getArtworks() : of([]),
      ]).subscribe(([projects, artworks])=>{
        this.projectList = newestFirst(projects ?? []);
        this.artworks = newestFirst(artworks ?? []);
        this.loaded = true;
      });
    });
  }

}
