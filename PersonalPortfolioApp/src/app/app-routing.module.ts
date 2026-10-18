import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CreateProjectComponent } from './components/create-project/create-project.component';
import { CreateWorkexperienceComponent } from './components/create-workexperience/create-workexperience.component';
import { ErrorComponent } from './components/error/error.component';
import { HomeComponent } from './components/home/home.component';
import { LoginComponent } from './components/login/login.component';
import { LogoutComponent } from './components/logout/logout.component';
import { ProjectByInterestComponent } from './components/project-by-interest/project-by-interest.component';
import { ViewWorkExperienceComponent } from './components/view-work-experience/view-work-experience.component';
import { PageTransitionGuard } from './services/page-transition.guard';

const pages: Routes = [
  {path: '', component: HomeComponent},
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

// Every page sits under one guard so each navigation is covered by the ink curtain first.
const routes: Routes = [
  {path: '', canActivateChild: [PageTransitionGuard], children: pages},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
