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
        this.router.navigateByUrl('', { skipLocationChange: true }).then(() => {
          this.router.navigate(['/interest/1']);
        }); 
        break; 
      }
      case "Art Works": { 
        this.router.navigateByUrl('', { skipLocationChange: true }).then(() => {
          this.router.navigate(['/interest/2']);
        });
        break; 
      }
      case "Software Development": { 
        this.router.navigateByUrl('', { skipLocationChange: true }).then(() => {
          this.router.navigate(['/interest/3']);
        });
        break; 
      }
      default: { 
        this.router.navigateByUrl('/home');
      } 
   }
  }

}
