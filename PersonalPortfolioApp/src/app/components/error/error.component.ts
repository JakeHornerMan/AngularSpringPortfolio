import { Component, OnInit } from '@angular/core';
import { SectionTitleService } from 'src/app/services/section-title.service';

@Component({
  selector: 'app-error',
  templateUrl: './error.component.html',
  styleUrls: ['./error.component.css']
})
export class ErrorComponent implements OnInit {

  constructor(private sectionTitle: SectionTitleService) { }

  ngOnInit(): void {
    this.sectionTitle.set('Not found');
  }

}
