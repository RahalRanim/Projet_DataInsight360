import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SuccesModal } from './succes-modal';

describe('SuccesModal', () => {
  let component: SuccesModal;
  let fixture: ComponentFixture<SuccesModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SuccesModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SuccesModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
