import { Directive, HostListener, ElementRef } from '@angular/core';

@Directive({
  selector: '[appNavSlider]'
})
export class NavSliderDirective {

  constructor(private elementRef: ElementRef) { }

  @HostListener('click')
  onClick(){
    var option = document.getElementsByClassName("option");
    for(let i=0; i<option.length; i++){
      option[i].classList.remove("active");
    }
    this.elementRef.nativeElement.classList.add("active");
  }

}
