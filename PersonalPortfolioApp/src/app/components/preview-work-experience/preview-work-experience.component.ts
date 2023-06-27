import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-preview-work-experience',
  templateUrl: './preview-work-experience.component.html',
  styleUrls: ['./preview-work-experience.component.css']
})
export class PreviewWorkExperienceComponent implements OnInit {

  constructor(@Inject(MAT_DIALOG_DATA) public data: any) { }

  ngOnInit(): void {
  }

}
