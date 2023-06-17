import { DOCUMENT } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
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

  selectedElement: any;

  constructor(private interestService:InterestService,
    private router: Router,
    @Inject(DOCUMENT) document: Document) { 

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
    // console.log(element)
    
    // if(!document.getElementById(input)?.classList.contains("selected")){
    //   document.getElementById(input)?.classList.add('selected');
    //   this.selectedElement.classList.remove('selected');
    //   this.selectedElement = document.getElementById(input);
    //   return;
    // }
    // else{
      

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
        case "Work Experience": { 
          this.router.navigateByUrl('', { skipLocationChange: true }).then(() => {
            this.router.navigate(['/workExperiences']);
          });
          break; 
        }
        default: { 
          this.router.navigateByUrl('/home');
        }
      }
    // }
  }

}
