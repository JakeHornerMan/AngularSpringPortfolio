import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Interest } from 'src/app/models/models';
import { InterestService } from 'src/app/services/interest.service';

@Component({
  selector: 'app-nav-slider',
  templateUrl: './nav-slider.component.html',
  styleUrls: ['./nav-slider.component.css']
})
export class NavSliderComponent implements OnInit {

  interestList = new Array<Interest>();

  constructor(private interestService:InterestService,
    private router: Router) { 

  }

  ngOnInit(): void {
    this.interestService.getAllInterests().subscribe((res: Interest[])=>{
      if(res){
        this.interestList = res;
        // console.log(this.interestList[0].title);
      }
    })
  }

  routeToPage(input: string){
    switch(input) { 
      case "All Projects": { 
        this.router.navigateByUrl('/home');
        break; 
      } 
      case "Game Development": { 
        this.router.navigateByUrl('/interest/1').then(() => {
          window.location.reload();
        });
        break; 
      }
      case "Art Works": { 
        this.router.navigateByUrl('/interest/2').then(() => {
          window.location.reload();
        });
        break; 
      }
      case "Software Development": { 
        this.router.navigateByUrl('/interest/3').then(() => {
          window.location.reload();
        });
        break; 
      }
      default: { 
        this.router.navigateByUrl('/home');
      } 
   }
  }

}
