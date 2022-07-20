import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './components/home/home.component';
import { InterestService } from './services/interest.service';
import { NavSliderComponent } from './components/nav-slider/nav-slider.component';
import { NavSliderDirective } from './directives/nav-slider.directive';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    NavSliderComponent,
    NavSliderDirective
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule
  ],
  providers: [InterestService],
  bootstrap: [AppComponent]
})
export class AppModule { }
