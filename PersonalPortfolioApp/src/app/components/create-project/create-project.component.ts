import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Content, Interest, Project } from 'src/app/models/models';
import { InterestService } from 'src/app/services/interest.service';
import { SecureService } from 'src/app/services/secure.service';
import { UserService } from 'src/app/services/user.service';
import { PreviewProjectComponent } from '../preview-project/preview-project.component';
import { ActivatedRoute, Router } from '@angular/router';
import { ProjectService } from 'src/app/services/project.service';

@Component({
  selector: 'app-create-project',
  templateUrl: './create-project.component.html',
  styleUrls: ['./create-project.component.css']
})
export class CreateProjectComponent implements OnInit {

  id!: number;

  title!: string;
  
  projectForm: FormGroup;

  interestId:number  =0;

  project: Project = {} as Project;

  constructor(private service: SecureService, 
    private projectService: ProjectService,
    private fb: FormBuilder,
    private dialog: MatDialog,
    private router: Router,
    private activatedroute: ActivatedRoute,) {
      this.projectForm = this.fb.group({
        projectName: new FormControl(''),
        startDate: new FormControl(''),
        endDate: new FormControl(''),
        mainPoints: new FormControl(''),
        linkedInterests: new FormControl(''),
        projectDescription: new FormControl(''),
        // cateorys: new FormControl(''), ???what is this???
        linkedTechnologys: new FormControl(''),
        contents: this.fb.array([])
      });
    }

  ngOnInit(): void {
    window.scroll(0,0);
    this.activatedroute.paramMap.subscribe(paramMap => { 
      //@ts-ignore
      this.id = paramMap.get('id'); 
    });
    if(this.id != null){
      this.title ="Edit Project";
      this.projectService.getProject(this.id).subscribe((res: any)=>{
        this.project = res;
        console.log(this.project);
        
        this.fillForm();
      },
      error => {
        console.log("Error, cannot get project by id: " + this.id);
      });
    }
    else{
      this.title ="Create Project";
    }
  }

  fillForm() {
    this.projectForm.patchValue(this.project);

    this.project.contentList.forEach((item) => {
      const contentForm= this.fb.group({
        projectId: ['', Validators.required],
        contentTitle: ['', Validators.required],
        contentParagraph: ['', Validators.required],
        contentType: ['', Validators.required],
        contentUrl: ['', Validators.required],
        position: ['', Validators.required],
      });
      contentForm.patchValue(item);
      this.contentForms.push(contentForm);
    });
  }

  setInterest(input: number): void {
    this.interestId = input;
    this.projectForm.controls['linkedInterests'].setValue(this.interestId);
  }

  setContentType(index: number, input: string): void {
    this.contentForms.controls[index].get('contentType')?.setValue(input);
    this.showContent(index);
  }

  contentTypeSelected(index: number): string{
    return this.contentForms.controls[index].get('contentType')?.value;
  }

  get contentForms(){
    return this.projectForm.get('contents') as FormArray;
  }

  addContent(){
    const contentForm= this.fb.group({
      projectId: ['', Validators.required],
	    contentTitle: ['', Validators.required],
      contentParagraph: ['', Validators.required],
	    contentType: ['', Validators.required],
	    contentUrl: ['', Validators.required],
      position: ['', Validators.required],
    });

    this.contentForms.push(contentForm);
  }

  deleteContent(i: number){
    this.contentForms.removeAt(i);
  }

  showContent(i: any): void {
    console.log(this.contentForms.controls[i]);
  }

  createAndSave(){
    this.createProject();
    let dialogRef = this.dialog.open(PreviewProjectComponent, {
      data: { project: this.project, isSaving: true},
      autoFocus: false,
      height: '100vh',
      minWidth: '100vw',
    });

    dialogRef.afterClosed().subscribe(result =>{
      console.log("You can now save this!");
      this.saveProject();
    })
  }

  createProject(){
    this.project.projectName = this.projectForm.controls['projectName'].value;
    this.project.startDate = this.projectForm.controls['startDate'].value;
    this.project.endDate = this.projectForm.controls['endDate'].value;
    this.project.mainPoints = this.projectForm.controls['mainPoints'].value;
    this.project.linkedInterests = this.projectForm.controls['linkedInterests'].value;
    // this.project.interestList = this.projectForm.controls['interestList'].value; ???what is this???
    this.project.linkedTechnologys = this.projectForm.controls['linkedTechnologys'].value;
    
    this.project.contentList = this.createProjectContents();
  }

  createProjectContents(): Content[]{
    let contentList: Content[] = [];
    let index = 0
    for (let control of this.contentForms.controls) {
      let content: Content = {} as Content;
      content.contentTitle = control.get('contentTitle')?.value;
      content.contentParagraph = control.get('contentParagraph')?.value;
      content.contentType = control.get('contentType')?.value;
      content.contentUrl = control.get('contentUrl')?.value;
      content.position = index;
      index++;
      contentList.push(content);
    }

    return contentList;
  }

  saveProject() {
    this.service.saveProject(this.project).subscribe((res: any)=>{
      this.project = res;
      this.router.navigateByUrl('/home');
    },
    error => {
      console.log("Error Saving!");
    });
  }

  updateProject() {
    this.service.updateProject(this.project).subscribe((res: any)=>{
      // console.log(res);
      this.project = res;
      this.router.navigateByUrl('/home');
    },
    error => {
      console.log("Error Saving!");
    });
  }

  viewProject(){
    this.createProject();

    let dialogRef = this.dialog.open(PreviewProjectComponent, {
      data: { project: this.project, isSaving: false },
      autoFocus: false,
      height: '100vh',
      minWidth: '100vw',
    });

    dialogRef.afterClosed().subscribe(result =>{
      console.log("You can now save this!");
    })
  }

  
}
