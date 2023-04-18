import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Interest } from 'src/app/models/models';
import { InterestService } from 'src/app/services/interest.service';
import { SecureService } from 'src/app/services/secure.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-create-project',
  templateUrl: './create-project.component.html',
  styleUrls: ['./create-project.component.css']
})
export class CreateProjectComponent implements OnInit {

  access!: boolean;

  interest: Interest = {id:56,title:"Game Development",description:"View Game Development Projects",imageUrl:"https://onfire.craftwork.design/images/s-5-img-26.png"};

  projectForm = new FormGroup({
    projectName: new FormControl(''),
    startDate: new FormControl(''),
    endDate: new FormControl(''),
    linkedInterests: new FormControl(''),
    cateorys: new FormControl(''),
    linkedTechnologys: new FormControl(''),
  });

  constructor(private service: SecureService, private userService: UserService) { }

  ngOnInit(): void {
    this.access = this.userService.isLoggedIn();
  }

  saveInterest(): void {
    this.service.saveInterest(this.interest).subscribe((res: any)=>{
      console.log(res);
    });
  }

}
