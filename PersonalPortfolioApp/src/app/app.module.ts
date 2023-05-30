import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import {MatExpansionModule} from '@angular/material/expansion';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import {MatDialogModule} from '@angular/material/dialog';

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

const appRoute: Routes =[
  {path: '', redirectTo: 'home', pathMatch: 'full'},
  {path:'home', component: HomeComponent},
  {path:'login', component: LoginComponent},
  {path:'createPage', component: CreateProjectComponent},
  {path:'interest/:id', component: ProjectByInterestComponent},
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
  ],
  providers: [InterestService],
  bootstrap: [AppComponent]
})
export class AppModule { }
