import { TestBed } from '@angular/core/testing';

import { WorkExperienceServiceService } from './work-experience-service.service';

describe('WorkExperienceServiceService', () => {
  let service: WorkExperienceServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WorkExperienceServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
