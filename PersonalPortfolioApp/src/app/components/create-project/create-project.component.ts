import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Content, Interest, Project } from 'src/app/models/models';
import { InterestService } from 'src/app/services/interest.service';
import { SecureService } from 'src/app/services/secure.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-create-project',
  templateUrl: './create-project.component.html',
  styleUrls: ['./create-project.component.css']
})
export class CreateProjectComponent implements OnInit {

  access!: boolean;
  
  projectForm: FormGroup;

  interestId:number  =0;

  project: Project = {} as Project;

  constructor(private service: SecureService, private userService: UserService,
    private fb: FormBuilder) {
      this.projectForm = this.fb.group({
        projectName: new FormControl(''),
        startDate: new FormControl(''),
        endDate: new FormControl(''),
        mainPoints: new FormControl(''),
        linkedInterests: new FormControl(''),
        // cateorys: new FormControl(''), ???what is this???
        linkedTechnologys: new FormControl(''),
        contents: this.fb.array([])
      });
    }

  ngOnInit(): void {
    this.access = this.userService.isLoggedIn();
  }

  // interest: Interest = {id:56,title:"Game Development",description:"View Game Development Projects",imageUrl:"https://onfire.craftwork.design/images/s-5-img-26.png"};
  // saveInterest(): void {
  //   this.service.saveInterest(this.interest).subscribe((res: any)=>{
  //     console.log(res);
  //   });
  // }

  delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
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
      // openedPanel: ['false'],
    });

    this.contentForms.push(contentForm);
  }

  deleteContent(i: number){
    this.contentForms.removeAt(i);
  }

  showContent(i: any): void {
    console.log(this.contentForms.controls[i]);
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
    this.saveProject();

    // this.saveContents();

    // console.log(this.project); //NEED TO FIGURE OUT HOW TO SET PROJECT ID TO CONTENT ID AND SAVE INDIVIDUALLY
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

  // previewProject(){
  //   let dialogRef = dialog.open(YourDialog, {
  //     data: { name: 'austin' },
  //   });
  // }

  saveProject() {
    this.service.saveProject(this.project).subscribe((res: any)=>{
      // console.log(res);
      this.project = res;
    });
  }

  updateProject() {
    this.service.updateProject(this.project).subscribe((res: any)=>{
      // console.log(res);
      this.project = res;
    });
  }

  saveContents() {
    this.service.saveContentsofProject(this.project).subscribe((res: any)=>{
      // console.log(res);
      this.project = res;
    });
  }



}
