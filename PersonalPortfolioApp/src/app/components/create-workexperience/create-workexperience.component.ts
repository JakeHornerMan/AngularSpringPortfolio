import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { Content, WorkExperience } from 'src/app/models/models';
import { ProjectService } from 'src/app/services/project.service';
import { SecureService } from 'src/app/services/secure.service';
import { PreviewWorkExperienceComponent } from '../preview-work-experience/preview-work-experience.component';
import { WorkExperienceService } from 'src/app/services/work-experience.service';

@Component({
  selector: 'app-create-workexperience',
  templateUrl: './create-workexperience.component.html',
  styleUrls: ['./create-workexperience.component.css']
})
export class CreateWorkexperienceComponent implements OnInit {

  id!: number;

  title!: string;
  
  workExperienceForm: FormGroup;

  interestId:number  =0;

  workExperience: WorkExperience = {} as WorkExperience;

  constructor(private service: SecureService, 
    private workExperienceService: WorkExperienceService,
    private fb: FormBuilder,
    private dialog: MatDialog,
    private router: Router,
    private activatedroute: ActivatedRoute) {

    this.workExperienceForm = this.fb.group({
      workPlace: new FormControl(''),
      workTitle: new FormControl(''),
      startDate: new FormControl(''),
      endDate: new FormControl(''),
      workDescription: new FormControl(''),
      workIconUrl: new FormControl(''),
      technologys: new FormControl(''),
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
      this.title ="Edit Work Experience";
      this.workExperienceService.getWorkExperience(this.id).subscribe((res: any)=>{
        this.workExperience = res;
        console.log(this.workExperience);
        
        this.fillForm();
      },
      error => {
        console.log("Error, cannot get project by id: " + this.id);
      });
    }
    else{
      this.title ="Create Work Experience";
    }
  }

  fillForm() {
    this.workExperienceForm.patchValue(this.workExperience);

    this.workExperience.contentList.forEach((item) => {
      const contentForm= this.fb.group({
        workExperienceId: ['', Validators.required],
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

  setContentType(index: number, input: string): void {
    this.contentForms.controls[index].get('contentType')?.setValue(input);
    this.showContent(index);
  }

  contentTypeSelected(index: number): string{
    return this.contentForms.controls[index].get('contentType')?.value;
  }

  get contentForms(){
    return this.workExperienceForm.get('contents') as FormArray;
  }

  addContent(){
    const contentForm= this.fb.group({
      workExperienceId: ['', Validators.required],
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

  createWorkExperience(){
    this.workExperience.workPlace = this.workExperienceForm.controls['workPlace'].value;
    this.workExperience.workTitle = this.workExperienceForm.controls['workTitle'].value;
    this.workExperience.startDate = this.workExperienceForm.controls['startDate'].value;
    this.workExperience.endDate = this.workExperienceForm.controls['endDate'].value;
    this.workExperience.workDescription = this.workExperienceForm.controls['workDescription'].value;
    this.workExperience.workIconUrl = this.workExperienceForm.controls['workIconUrl'].value;
    this.workExperience.technologys = this.workExperienceForm.controls['technologys'].value;
    this.workExperience.active = true;
    
    this.workExperience.contentList = this.createWorkExperienceContents();
  }

  createWorkExperienceContents(): Content[]{
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

  viewWorkExperience(){
    this.createWorkExperience();

    let dialogRef = this.dialog.open(PreviewWorkExperienceComponent, {
      data: { workExperience: this.workExperience, isSaving: false },
      autoFocus: false,
      height: '100vh',
      minWidth: '100vw',
    });

    dialogRef.afterClosed().subscribe(result =>{
      console.log("You can now save this!");
    })
  }

  createAndSave(){
    this.createWorkExperience();

    let dialogRef = this.dialog.open(PreviewWorkExperienceComponent, {
      data: { workExperience: this.workExperience, isSaving: true},
      autoFocus: false,
      height: '100vh',
      minWidth: '100vw',
    });

    dialogRef.afterClosed().subscribe(result =>{
      if(result){
        console.log("You can now save this!");
        this.saveWorkExperience();
      }
    })
  }

  saveWorkExperience() {
    this.service.saveWorkExperience(this.workExperience).subscribe((res: any)=>{
      this.workExperience = res;
      this.router.navigateByUrl('/workExperiences');
    },
    error => {
      console.log("Error Saving!");
    });
  }

  updateWorkExperience() {
    this.service.updateWorkExperience(this.workExperience).subscribe((res: any)=>{
      // console.log(res);
      this.workExperience = res;
      this.router.navigateByUrl('/workExperiences');
    },
    error => {
      console.log("Error Saving!");
    });
  }

}
