import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FooterComponent } from './footer.component';

describe('FooterComponent', () => {
  let component: FooterComponent;
  let fixture: ComponentFixture<FooterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FooterComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(FooterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set currentYear to the current year', () => {
    const currentYear = new Date().getFullYear();
    expect(component.currentYear).toBe(currentYear);
  });

  it('should render contact section with email and phone', () => {
    const compiled = fixture.nativeElement;
    const contactSection = compiled.querySelector('.contact-section');
    expect(contactSection).toBeTruthy();

    const emailLink = compiled.querySelector('a[href^="mailto:"]');
    expect(emailLink).toBeTruthy();
    expect(emailLink.textContent).toContain('support@pharmacystore.com');
  });

  it('should render copyright with current year', () => {
    const compiled = fixture.nativeElement;
    const copyright = compiled.querySelector('.copyright');
    expect(copyright).toBeTruthy();
    expect(copyright.textContent).toContain(component.currentYear.toString());
  });

  it('should have footer element with id="footer"', () => {
    const compiled = fixture.nativeElement;
    const footer = compiled.querySelector('footer#footer');
    expect(footer).toBeTruthy();
  });
});
