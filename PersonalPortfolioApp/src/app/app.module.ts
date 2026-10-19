import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import {MatExpansionModule} from '@angular/material/expansion';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import {MatDialogModule} from '@angular/material/dialog';
import { CookieService } from 'ngx-cookie-service';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './components/home/home.component';
import { InterestService } from './services/interest.service';
import { LoadingInterceptor } from './services/loading.interceptor';
import { StaticContentInterceptor } from './services/static-content.interceptor';
import { InkFieldComponent } from './components/ink-field/ink-field.component';
import { IntroLoaderComponent } from './components/intro-loader/intro-loader.component';
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
import { BounceFieldDirective } from './directives/bounce-field.directive';
import { MediaWindowComponent } from './components/media-window/media-window.component';

// const appRoute: Routes =[
//   {path: '', redirectTo: 'home', pathMatch: 'full'},
//   {path:'home', component: HomeComponent},
//   {path:'login', component: LoginComponent},
//   {path:'logout', component: LogoutComponent},
//   {path:'createProject', component: CreateProjectComponent},
//   {path:'interest/:id', component: ProjectByInterestComponent},
//   {path:'createProject/:id', component: CreateProjectComponent},
//   {path:'workExperiences', component: ViewWorkExperienceComponent},
//   {path:'createWorkExperience', component: CreateWorkexperienceComponent},
//   {path:'createWorkExperience/:id', component: CreateWorkexperienceComponent},
//   {path:'**', component: ErrorComponent} //must be last
// ];
import { TerminalSwarmComponent } from './components/terminal-swarm/terminal-swarm.component';
import { ArtSliderComponent } from './components/art-slider/art-slider.component';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    InkFieldComponent,
    IntroLoaderComponent,
    BounceFieldDirective,
    MediaWindowComponent,
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
    TerminalSwarmComponent,
    ArtSliderComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    MatExpansionModule,
    BrowserAnimationsModule,
    ReactiveFormsModule,
    FormsModule,
    MatDialogModule,
  ],
  providers: [
    InterestService,
    CookieService,
    { provide: HTTP_INTERCEPTORS, useClass: LoadingInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: StaticContentInterceptor, multi: true },
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
