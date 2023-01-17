import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import {MatExpansionModule} from '@angular/material/expansion';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './components/home/home.component';
import { InterestService } from './services/interest.service';
import { NavSliderComponent } from './components/nav-slider/nav-slider.component';
import { NavSliderDirective } from './directives/nav-slider.directive';
import { ProjectContentComponent } from './components/project-content/project-content.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    NavSliderComponent,
    NavSliderDirective,
    ProjectContentComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    MatExpansionModule,
    BrowserAnimationsModule,
  ],
  providers: [InterestService],
  bootstrap: [AppComponent]
})
export class AppModule { }
