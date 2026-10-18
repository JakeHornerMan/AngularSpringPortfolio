import { Component, OnInit } from '@angular/core';
import { SectionTitleService } from 'src/app/services/section-title.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-logout',
  templateUrl: './logout.component.html',
  styleUrls: ['./logout.component.css']
})
export class LogoutComponent implements OnInit {

  constructor(private userService: UserService, private sectionTitle: SectionTitleService) { }

  ngOnInit(): void {
    this.sectionTitle.set('Logged out');
    this.userService.clearCookies();
  }

}
