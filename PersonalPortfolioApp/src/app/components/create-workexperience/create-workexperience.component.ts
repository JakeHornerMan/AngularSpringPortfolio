import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { WorkExperience } from 'src/app/models/models';
import { ProjectService } from 'src/app/services/project.service';
import { SecureService } from 'src/app/services/secure.service';

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
    private projectService: ProjectService,
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
      this.projectService.getProject(this.id).subscribe((res: any)=>{
        this.workExperience = res;
        console.log(this.workExperience);
        
        //TODO: fill fome with object
        // this.fillForm();
      },
      error => {
        console.log("Error, cannot get project by id: " + this.id);
      });
    }
    else{
      this.title ="Create Work Experience";
    }
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

}
