import { Component, OnInit } from '@angular/core';
import { Interest } from 'src/app/models/interest';
import { InterestService } from 'src/app/services/interest.service';

@Component({
  selector: 'app-nav-slider',
  templateUrl: './nav-slider.component.html',
  styleUrls: ['./nav-slider.component.css']
})
export class NavSliderComponent implements OnInit {

  interestList = new Array<Interest>();

  constructor(private interestService:InterestService) { 

  }

  ngOnInit(): void {
    this.interestService.getAllInterests().subscribe((res: Interest[])=>{
      if(res){
        this.interestList = res;
        // console.log(this.interestList[0].title);
      }
    })
  }

}
