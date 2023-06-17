import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewWorkExperienceComponent } from './view-work-experience.component';

describe('ViewWorkExperienceComponent', () => {
  let component: ViewWorkExperienceComponent;
  let fixture: ComponentFixture<ViewWorkExperienceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ViewWorkExperienceComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewWorkExperienceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
