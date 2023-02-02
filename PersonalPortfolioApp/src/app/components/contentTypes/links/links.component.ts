import { Component, Input, OnInit } from '@angular/core';
import { Content } from 'src/app/models/models';

@Component({
  selector: 'app-links',
  templateUrl: './links.component.html',
  styleUrls: ['./links.component.css']
})
export class LinksComponent implements OnInit {

  @Input() content!: Content;

  constructor() { }

  ngOnInit(): void {
  }

}
