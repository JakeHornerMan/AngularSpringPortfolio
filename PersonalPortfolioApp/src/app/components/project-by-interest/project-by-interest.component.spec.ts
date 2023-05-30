import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectByInterestComponent } from './project-by-interest.component';

describe('ProjectByInterestComponent', () => {
  let component: ProjectByInterestComponent;
  let fixture: ComponentFixture<ProjectByInterestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ProjectByInterestComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProjectByInterestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
