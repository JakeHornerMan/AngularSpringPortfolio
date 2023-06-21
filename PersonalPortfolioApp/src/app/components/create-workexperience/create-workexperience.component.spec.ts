import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateWorkexperienceComponent } from './create-workexperience.component';

describe('CreateWorkexperienceComponent', () => {
  let component: CreateWorkexperienceComponent;
  let fixture: ComponentFixture<CreateWorkexperienceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CreateWorkexperienceComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateWorkexperienceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
