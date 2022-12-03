import { HttpClientModule } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Interest } from 'src/app/models/models';
import { InterestService } from 'src/app/services/interest.service';


@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

interestList = new Array<Interest>();

  constructor(private interestService:InterestService) { 

  }

  ngOnInit(): void {
    this.interestService.getAllInterests().subscribe((res: Interest[])=>{
      if(res){
        this.interestList = res;
        console.log(this.interestList[0].title);
      }
    })
  }

  getInterests(){
    
  }

}
