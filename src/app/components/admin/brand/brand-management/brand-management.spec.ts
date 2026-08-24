import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BrandManagement } from './brand-management';

describe('BrandManagement', () => {
  let component: BrandManagement;
  let fixture: ComponentFixture<BrandManagement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BrandManagement]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BrandManagement);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
