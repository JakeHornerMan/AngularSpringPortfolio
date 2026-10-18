import { Component, ElementRef, HostBinding, HostListener, Input, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Content, Project, WorkExperience } from 'src/app/models/models';
import { UserService } from 'src/app/services/user.service';
import { DeletePopupComponent } from '../delete-popup/delete-popup.component';
import { SecureService } from 'src/app/services/secure.service';
import { OpenableWindow, OpenWindowService } from 'src/app/services/open-window.service';
import { ContentBlock, groupContent } from 'src/app/content-blocks';

@Component({
  selector: 'app-work-experience-content',
  templateUrl: './work-experience-content.component.html',
  styleUrls: ['./work-experience-content.component.css']
})
export class WorkExperienceContentComponent implements OnInit, OnDestroy, OpenableWindow {

  @Input() workExperience!: WorkExperience;
  // Shown in the title bar instead of the workplace's name.
  @Input() barTitle?: string;
  contentList = new Array<Content>();
  blocks: ContentBlock[] = [];
  liList = new Array<String>();
  @Input() @HostBinding('class.wide') open = false;

  @HostBinding('class.starred') get starred(): boolean {
    return !!this.workExperience?.starred;
  }

  constructor(private userService: UserService, 
    private router: Router,
    private service: SecureService,
    private dialog: MatDialog,
    private openWindows: OpenWindowService,
    private host: ElementRef<HTMLElement>,) { }

  ngOnInit(): void {
    this.contentList = this.workExperience.contentList;
    this.sortContent();
  }

  sortContent(){
    this.contentList.sort((a, b) => {
      return a.position - b.position;
    });
    this.contentList = this.workExperience.contentList;
    this.blocks = groupContent(this.contentList);
  }

  // A click anywhere on a closed window opens it, except on its links and buttons, or at the end of a
  // drag (the title bar is a drag handle) or a text selection.
  @HostBinding('class.openable') get openable(): boolean {
    return !this.open && this.hasMore();
  }

  private downAt: [number, number] | null = null;

  get element(): HTMLElement {
    return this.host.nativeElement;
  }

  @HostListener('pointerdown', ['$event'])
  onPointerDown(event: PointerEvent){
    this.downAt = [event.clientX, event.clientY];
  }

  @HostListener('click', ['$event'])
  onClick(event: MouseEvent){
    if (!this.openable || (event.target as HTMLElement).closest('a, button, input, textarea')) return;
    if (this.downAt && Math.hypot(event.clientX - this.downAt[0], event.clientY - this.downAt[1]) > 5) return;
    this.toggle();
  }

  // An opened pocket spans the whole row of the pockets grid.
  // Only one window opens at a time: trying to open this one while another is open just closes that one.
  toggle(){
    if (this.open) {
      this.close();
    } else if (this.openWindows.requestOpen(this)) {
      this.open = true;
    }
  }

  // The headline is the workplace without any note in brackets ("Ergo (Contract: SBCI Customer Hub)" is
  // just "Ergo"); the title bar keeps the full name.
  headline(): string {
    return this.workExperience.workPlace.replace(/\s*\(.*\)\s*$/, '');
  }

  // Closed, the window shows the tldr; opened, the full description (or the tldr if there isn't one).
  summary(): string {
    const { tldr, workDescription } = this.workExperience;
    return (this.open || !tldr ? workDescription : tldr) || tldr || '';
  }

  hasMore(): boolean {
    return this.contentList?.length > 0 || (!!this.workExperience.tldr && !!this.workExperience.workDescription);
  }

  close(){
    this.open = false;
    this.openWindows.closed(this);
  }

  ngOnDestroy(): void {
    this.openWindows.closed(this);
  }

  isUserLoggedIn(): boolean{
    return this.userService.isLoggedIn();
  }

  editWorkExperience(id: number){
    this.router.navigateByUrl('', { skipLocationChange: true }).then(() => {
      this.router.navigate(['/createWorkExperience/'+id]);
    });
  }

  removeWorkExperience(workExperienceId: number){
    let dialogRef = this.dialog.open(DeletePopupComponent, {
      autoFocus: false,
      height: '100vh',
      minWidth: '100vw',
    });

    dialogRef.afterClosed().subscribe(result =>{
      if(result){
        this.service.deleteWorkExperience(workExperienceId).subscribe((res: any)=>{
          console.log("this is now deleted");
          console.log(this.workExperience);
          window.location.reload();
          this.router.navigate(['home']);
          
        },
        error => {
          console.log("Error Deleting!");
        });
      }
    })
  }

}
