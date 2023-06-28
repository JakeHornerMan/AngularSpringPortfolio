import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-delete-popup',
  templateUrl: './delete-popup.component.html',
  styleUrls: ['./delete-popup.component.css']
})
export class DeletePopupComponent implements OnInit {

  areYouSure: boolean = false;

  constructor() { }

  ngOnInit(): void {
  }

}
