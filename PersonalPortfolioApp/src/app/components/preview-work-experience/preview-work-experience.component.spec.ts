import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PreviewWorkExperienceComponent } from './preview-work-experience.component';

describe('PreviewWorkExperienceComponent', () => {
  let component: PreviewWorkExperienceComponent;
  let fixture: ComponentFixture<PreviewWorkExperienceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PreviewWorkExperienceComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PreviewWorkExperienceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
