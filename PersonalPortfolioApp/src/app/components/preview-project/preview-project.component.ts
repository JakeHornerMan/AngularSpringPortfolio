import { ScrollStrategy, ScrollStrategyOptions } from '@angular/cdk/overlay';
import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Project } from 'src/app/models/models';

@Component({
  selector: 'app-preview-project',
  templateUrl: './preview-project.component.html',
  styleUrls: ['./preview-project.component.css']
})
export class PreviewProjectComponent implements OnInit {

  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {
   }

  ngOnInit(): void {
  }

}
