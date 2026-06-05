import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideTranslateService, TranslateLoader } from '@ngx-translate/core';
import { TranslateNoOpLoader } from '@ngx-translate/core';
import { StanceChipComponent } from './stance-chip.component';

describe('StanceChipComponent', () => {
  let fixture: ComponentFixture<StanceChipComponent>;
  let component: StanceChipComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StanceChipComponent],
      providers: [
        provideTranslateService({
          loader: { provide: TranslateLoader, useClass: TranslateNoOpLoader },
        }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(StanceChipComponent);
    component = fixture.componentInstance;
  });

  it('renders CSS class stance-support when stance is "support"', () => {
    component.stance = 'support';
    fixture.detectChanges();
    const span = fixture.nativeElement.querySelector('span');
    expect(span.classList.contains('stance-support')).toBe(true);
  });

  it('renders CSS class stance-oppose when stance is "oppose"', () => {
    component.stance = 'oppose';
    fixture.detectChanges();
    const span = fixture.nativeElement.querySelector('span');
    expect(span.classList.contains('stance-oppose')).toBe(true);
  });

  it('renders CSS class stance-unclear when stance is "unclear"', () => {
    component.stance = 'unclear';
    fixture.detectChanges();
    const span = fixture.nativeElement.querySelector('span');
    expect(span.classList.contains('stance-unclear')).toBe(true);
  });
});
