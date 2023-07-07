import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import {MatExpansionModule} from '@angular/material/expansion';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import {MatDialogModule} from '@angular/material/dialog';
import { CookieService } from 'ngx-cookie-service';
import {MatSidenavModule} from '@angular/material/sidenav';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './components/home/home.component';
import { InterestService } from './services/interest.service';
import { NavSliderComponent } from './components/nav-slider/nav-slider.component';
import { NavSliderDirective } from './directives/nav-slider.directive';
import { ProjectContentComponent } from './components/project-content/project-content.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ParagraphsComponent } from './components/contentTypes/paragraphs/paragraphs.component';
import { VideosComponent } from './components/contentTypes/videos/videos.component';
import { ImagesComponent } from './components/contentTypes/images/images.component';
import { LinksComponent } from './components/contentTypes/links/links.component';
import { LoginComponent } from './components/login/login.component';
import { ErrorComponent } from './components/error/error.component';
import { CreateProjectComponent } from './components/create-project/create-project.component';
import { PreviewProjectComponent } from './components/preview-project/preview-project.component';
import { ProjectByInterestComponent } from './components/project-by-interest/project-by-interest.component';
import { ViewWorkExperienceComponent } from './components/view-work-experience/view-work-experience.component';
import { LogoutComponent } from './components/logout/logout.component';
import { CreateWorkexperienceComponent } from './components/create-workexperience/create-workexperience.component';
import { PreviewWorkExperienceComponent } from './components/preview-work-experience/preview-work-experience.component';
import { WorkExperienceContentComponent } from './components/work-experience-content/work-experience-content.component';
import { DeletePopupComponent } from './components/delete-popup/delete-popup.component';

const appRoute: Routes =[
  {path: '', redirectTo: 'home', pathMatch: 'full'},
  {path:'home', component: HomeComponent},
  {path:'login', component: LoginComponent},
  {path:'logout', component: LogoutComponent},
  {path:'createProject', component: CreateProjectComponent},
  {path:'interest/:id', component: ProjectByInterestComponent},
  {path:'createProject/:id', component: CreateProjectComponent},
  {path:'workExperiences', component: ViewWorkExperienceComponent},
  {path:'createWorkExperience', component: CreateWorkexperienceComponent},
  {path:'createWorkExperience/:id', component: CreateWorkexperienceComponent},
  {path:'**', component: ErrorComponent} //must be last
];

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    NavSliderComponent,
    NavSliderDirective,
    ProjectContentComponent,
    ParagraphsComponent,
    VideosComponent,
    ImagesComponent,
    LinksComponent,
    LoginComponent,
    ErrorComponent,
    CreateProjectComponent,
    PreviewProjectComponent,
    ProjectByInterestComponent,
    ViewWorkExperienceComponent,
    LogoutComponent,
    CreateWorkexperienceComponent,
    PreviewWorkExperienceComponent,
    WorkExperienceContentComponent,
    DeletePopupComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    MatExpansionModule,
    BrowserAnimationsModule,
    RouterModule.forRoot(appRoute),
    ReactiveFormsModule,
    FormsModule,
    MatDialogModule,
    MatSidenavModule,
  ],
  providers: [InterestService, CookieService],
  bootstrap: [AppComponent]
})
export class AppModule { }
