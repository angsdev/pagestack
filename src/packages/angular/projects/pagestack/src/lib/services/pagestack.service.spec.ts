import { TestBed } from '@angular/core/testing';

import { PagestackService } from './pagestack.service';

describe('PagestackService', () => {
  let service: PagestackService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PagestackService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
