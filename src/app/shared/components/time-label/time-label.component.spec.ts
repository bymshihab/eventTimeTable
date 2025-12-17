import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TimeLabelComponent } from './time-label.component';

describe('TimeLabelComponent', () => {
  let component: TimeLabelComponent;
  let fixture: ComponentFixture<TimeLabelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TimeLabelComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TimeLabelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
