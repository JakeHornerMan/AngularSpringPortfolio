import { TestBed } from '@angular/core/testing';

import { SecureService } from './secure.service';

describe('SecureService', () => {
  let service: SecureService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SecureService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
