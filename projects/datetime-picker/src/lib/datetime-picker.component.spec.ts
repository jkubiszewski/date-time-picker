import { DatetimePickerComponent } from './datetime-picker.component';
import { ComponentFixture, fakeAsync, flush, inject, TestBed } from '@angular/core/testing';
import { Component, FactoryProvider, Type, ValueProvider, ViewChild } from '@angular/core';
import { DatetimePickerInputDirective } from './datetime-picker-input.directive';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { DatetimePickerModule } from './datetime-picker.module';
import { OverlayContainer } from '@angular/cdk/overlay';
import { NativeDatetimeModule } from './adapter/native';
import {
  dispatchKeyboardEvent,
  dispatchMouseEvent,
  createKeyboardEvent,
  dispatchEvent,
  dispatchFakeEvent
} from '../test-helpers';
import { ENTER, ESCAPE, RIGHT_ARROW, UP_ARROW } from '@angular/cdk/keycodes';
import { By } from '@angular/platform-browser';
import { DatetimePickerContainerComponent } from './datetime-picker-container.component';
import { DatetimePickerToggleDirective } from './datetime-picker-toggle.directive';
import { DEC, FEB, JAN, JUL, JUN } from './utils/month-constants';
import { PickerType, PickerMode, SelectMode, ViewType } from './datetime-picker.class';

describe('DatetimeComponent', () => {
  const SUPPORTS_INTL = typeof Intl !== 'undefined';

  // Creates a test component fixture.
  function createComponent(
    component: Type<any>,
    imports: Type<any>[] = [],
    providers: (FactoryProvider | ValueProvider)[] = []
  ): ComponentFixture<any> {
    TestBed.configureTestingModule({
      imports: [
        FormsModule,
        DatetimePickerModule,
        NoopAnimationsModule,
        ReactiveFormsModule,
        ...imports
      ],
      providers,
      declarations: [component]
    });

    return TestBed.createComponent(component);
  }

  afterEach(inject([OverlayContainer], (container: OverlayContainer) => {
    container.ngOnDestroy();
  }));

  describe('with NativeDatetimeModule', () => {
    describe('standard DatetimePicker', () => {
      let fixture: ComponentFixture<StandardDatetimePickerComponent>;
      let testComponent: StandardDatetimePickerComponent;
      let containerElement: HTMLElement;

      beforeEach(fakeAsync(() => {
        fixture = createComponent(StandardDatetimePickerComponent, [NativeDatetimeModule]);
        fixture.detectChanges();
        testComponent = fixture.componentInstance;
      }));

      afterEach(fakeAsync(() => {
        testComponent.datetimePicker.close();
        fixture.detectChanges();
        flush();
      }));

      it('should initialize with correct value shown in input', () => {
        if (SUPPORTS_INTL) {
          expect(fixture.nativeElement.querySelector('input').value).toBe('1/1/2020, 12:00 AM');
        }
      });

      it('should open popup when pickerMode is "popup"', () => {
        expect(document.querySelector('.cdk-overlay-pane.dtp-popup')).toBeNull();

        testComponent.datetimePicker.open();
        fixture.detectChanges();

        expect(document.querySelector('.cdk-overlay-pane.dtp-popup')).not.toBeNull();
      });

      it('should open dialog when pickerMode is "dialog"', () => {
        testComponent.pickerMode = 'dialog';
        fixture.detectChanges();

        expect(document.querySelector('.dtp-dialog dialog-container')).toBeNull();

        testComponent.datetimePicker.open();
        fixture.detectChanges();

        expect(document.querySelector('.dtp-dialog dialog-container')).not.toBeNull();
      });

      it('should open datetimePicker if opened input is set to true', fakeAsync(() => {
        testComponent.opened = true;
        fixture.detectChanges();
        flush();

        expect(document.querySelector('.dtp-container')).not.toBeNull();

        testComponent.opened = false;
        fixture.detectChanges();
        flush();

        expect(document.querySelector('.dtp-container')).toBeNull();
      }));

      it('should NOT open datetimePicker if it is disabled', () => {
        testComponent.disabled = true;
        fixture.detectChanges();

        expect(document.querySelector('.cdk-overlay-pane')).toBeNull();
        expect(document.querySelector('ng-datetime-picker-container')).toBeNull();

        testComponent.datetimePicker.open();
        fixture.detectChanges();

        expect(document.querySelector('.cdk-overlay-pane')).toBeNull();
        expect(document.querySelector('ng-datetime-picker-container')).toBeNull();
      });

      it('disabled datetimePicker input should open the picker panel if datetimePicker is enabled', () => {
        testComponent.datetimePicker.disabled = false;
        testComponent.datetimePickerInput.disabled = true;
        fixture.detectChanges();

        expect(document.querySelector('.cdk-overlay-pane')).toBeNull();

        testComponent.datetimePicker.open();
        fixture.detectChanges();

        expect(document.querySelector('.cdk-overlay-pane')).not.toBeNull();
      });

      it('should close popup when fn close is called', fakeAsync(() => {
        testComponent.datetimePicker.open();
        fixture.detectChanges();
        flush();

        const popup = document.querySelector('.cdk-overlay-pane')!;
        expect(popup).not.toBeNull();
        expect(parseInt(getComputedStyle(popup).height, 10)).not.toBe(0);

        testComponent.datetimePicker.close();
        fixture.detectChanges();
        flush();

        expect(getComputedStyle(popup).height).toBe('');
      }));

      it('should close the popup when pressing ESCAPE', fakeAsync(() => {
        testComponent.datetimePicker.open();
        fixture.detectChanges();
        flush();

        expect(testComponent.datetimePicker.opened).toBe(
          true,
          'Expected datetimePicker to be open.'
        );

        dispatchKeyboardEvent(document.body, 'keydown', ESCAPE);
        fixture.detectChanges();
        flush();

        expect(testComponent.datetimePicker.opened).toBe(
          false,
          'Expected datetimePicker to be closed.'
        );
      }));

      it('should close dialog when fn close is called', fakeAsync(() => {
        testComponent.pickerMode = 'dialog';
        fixture.detectChanges();

        testComponent.datetimePicker.open();
        fixture.detectChanges();
        flush();

        expect(document.querySelector('dialog-container')).not.toBeNull();

        testComponent.datetimePicker.close();
        fixture.detectChanges();
        flush();

        expect(document.querySelector('dialog-container')).toBeNull();
      }));

      it('should close popup panel when cancel button clicked', fakeAsync(() => {
        testComponent.datetimePicker.open();
        fixture.detectChanges();
        flush();
        expect(testComponent.datetimePicker.opened).toBe(
          true,
          'Expected datetimePicker to be opened.'
        );

        const containerDebugElement = fixture.debugElement.query(
          By.directive(DatetimePickerContainerComponent)
        );
        containerElement = containerDebugElement.nativeElement;

        const btns = containerElement.querySelectorAll('.dtp-container-control-button');
        dispatchMouseEvent(btns[0], 'click'); // 'Cancel' button
        fixture.detectChanges();
        flush();

        expect(testComponent.datetimePicker.opened).toBe(
          false,
          'Expected datetimePicker to be closed.'
        );
      }));

      it('should close popup panel and not update input value when cancel button clicked', fakeAsync(() => {
        testComponent.datetimePicker.open();
        fixture.detectChanges();
        flush();
        expect(testComponent.datetimePicker.opened).toBe(
          true,
          'Expected datetimePicker to be opened.'
        );

        const containerDebugElement = fixture.debugElement.query(
          By.directive(DatetimePickerContainerComponent)
        );
        containerElement = containerDebugElement.nativeElement;

        const monthCell = containerElement.querySelector('[aria-label="January 2, 2020"]');
        (monthCell as HTMLElement).click();
        fixture.detectChanges();

        const btns = containerElement.querySelectorAll('.dtp-container-control-button');
        dispatchMouseEvent(btns[0], 'click'); // 'Cancel' button
        fixture.detectChanges();
        flush();

        expect(testComponent.datetimePicker.opened).toBe(
          false,
          'Expected datetimePicker to be closed.'
        );
        expect(testComponent.datetimePickerInput.value).toEqual(new Date(2020, JAN, 1)); // not update to clicked value
      }));

      it('should update input value to pickerMoment value and close popup panel when set button clicked', fakeAsync(() => {
        testComponent.datetimePicker.open();
        fixture.detectChanges();
        flush();
        expect(testComponent.datetimePicker.opened).toBe(
          true,
          'Expected datetimePicker to be opened.'
        );

        const containerDebugElement = fixture.debugElement.query(
          By.directive(DatetimePickerContainerComponent)
        );
        containerElement = containerDebugElement.nativeElement;
        expect(containerDebugElement.componentInstance.pickerMoment).toEqual(
          new Date(2020, JAN, 1)
        );

        const btns = containerElement.querySelectorAll('.dtp-container-control-button');
        dispatchMouseEvent(btns[1], 'click'); // 'Set' button
        fixture.detectChanges();
        flush();

        expect(testComponent.datetimePicker.opened).toBe(
          false,
          'Expected datetimePicker to be closed.'
        );
        expect(testComponent.datetimePickerInput.value).toEqual(new Date(2020, JAN, 1));
      }));

      it('should update input value to clicked date value and close popup panel when set button clicked', fakeAsync(() => {
        testComponent.datetimePicker.open();
        fixture.detectChanges();
        flush();
        expect(testComponent.datetimePicker.opened).toBe(
          true,
          'Expected datetimePicker to be opened.'
        );

        const containerDebugElement = fixture.debugElement.query(
          By.directive(DatetimePickerContainerComponent)
        );
        containerElement = containerDebugElement.nativeElement;
        expect(containerDebugElement.componentInstance.pickerMoment).toEqual(
          new Date(2020, JAN, 1)
        );

        const monthCell = containerElement.querySelector('[aria-label="January 2, 2020"]');
        (monthCell as HTMLElement).click();
        fixture.detectChanges();

        const btns = containerElement.querySelectorAll('.dtp-container-control-button');
        dispatchMouseEvent(btns[1], 'click'); // 'Set' button
        fixture.detectChanges();
        flush();

        expect(testComponent.datetimePicker.opened).toBe(
          false,
          'Expected datetimePicker to be closed.'
        );
        expect(testComponent.datetimePickerInput.value).toEqual(new Date(2020, JAN, 2));
      }));

      it('should set startAt fallback to input value', () => {
        expect(testComponent.datetimePicker.startAt).toEqual(new Date(2020, JAN, 1));
      });

      it('input should aria-owns ng-datetime-container after opened in popup mode', fakeAsync(() => {
        const inputEl = fixture.debugElement.query(By.css('input')).nativeElement;
        expect(inputEl.getAttribute('aria-owns')).toBeNull();

        testComponent.datetimePicker.open();
        fixture.detectChanges();
        flush();
        fixture.detectChanges();

        const ownedElementId = inputEl.getAttribute('aria-owns');
        expect(ownedElementId).not.toBeNull();

        const ownedElement = document.getElementById(ownedElementId);
        expect(ownedElement).not.toBeNull();
        expect((ownedElement as Element).tagName.toLowerCase()).toBe(
          'ng-datetime-picker-container'
        );
      }));

      it('input should aria-owns ng-datetime-container after opened in dialog mode', fakeAsync(() => {
        testComponent.pickerMode = 'dialog';
        fixture.detectChanges();

        const inputEl = fixture.debugElement.query(By.css('input')).nativeElement;
        expect(inputEl.getAttribute('aria-owns')).toBeNull();

        testComponent.datetimePicker.open();
        fixture.detectChanges();
        flush();
        fixture.detectChanges();

        const ownedElementId = inputEl.getAttribute('aria-owns');
        expect(ownedElementId).not.toBeNull();

        const ownedElement = document.getElementById(ownedElementId);
        expect(ownedElement).not.toBeNull();
        expect((ownedElement as Element).tagName.toLowerCase()).toBe(
          'ng-datetime-picker-container'
        );
      }));

      it('should close the picker popup panel using ALT + UP_ARROW', fakeAsync(() => {
        testComponent.datetimePicker.open();
        fixture.detectChanges();
        flush();

        expect(testComponent.datetimePicker.opened).toBe(true);

        const event = createKeyboardEvent('keydown', UP_ARROW);
        Object.defineProperty(event, 'altKey', { get: () => true });

        dispatchEvent(document.body, event);
        fixture.detectChanges();
        flush();

        expect(testComponent.datetimePicker.opened).toBe(false);
      }));

      describe('with only calendar', () => {
        beforeEach(() => {
          testComponent.pickerType = 'calendar';
          fixture.detectChanges();
        });

        it('should initialize with correct value shown in input', () => {
          if (SUPPORTS_INTL) {
            expect(fixture.nativeElement.querySelector('input').value).toBe('1/1/2020');
          }
        });

        it('should NOT have any container control button', fakeAsync(() => {
          testComponent.datetimePicker.open();
          fixture.detectChanges();
          flush();
          expect(testComponent.datetimePicker.opened).toBe(
            true,
            'Expected datetimePicker to be opened.'
          );

          const containerDebugElement = fixture.debugElement.query(
            By.directive(DatetimePickerContainerComponent)
          );
          containerElement = containerDebugElement.nativeElement;
          const btns = containerElement.querySelectorAll('.dtp-container-control-button');

          expect(btns.length).toBe(0);
        }));

        it('should update input value to clicked date value and close popup panel when date cell is clicked', fakeAsync(() => {
          testComponent.datetimePicker.open();
          fixture.detectChanges();
          flush();
          expect(testComponent.datetimePicker.opened).toBe(
            true,
            'Expected datetimePicker to be opened.'
          );

          const containerDebugElement = fixture.debugElement.query(
            By.directive(DatetimePickerContainerComponent)
          );
          containerElement = containerDebugElement.nativeElement;
          expect(containerDebugElement.componentInstance.pickerMoment).toEqual(
            new Date(2020, JAN, 1)
          );

          const dateCell = containerElement.querySelector('[aria-label="January 2, 2020"]');
          dispatchMouseEvent(dateCell, 'click');
          fixture.detectChanges();
          flush();

          expect(testComponent.datetimePicker.opened).toBe(
            false,
            'Expected datetimePicker to be closed.'
          );
          expect(testComponent.datetimePickerInput.value).toEqual(new Date(2020, JAN, 2));
        }));

        it('should update input value to clicked date value and close popup panel when date cell is clicked via pressing enter', fakeAsync(() => {
          testComponent.datetimePicker.open();
          fixture.detectChanges();
          flush();
          expect(testComponent.datetimePicker.opened).toBe(
            true,
            'Expected datetimePicker to be opened.'
          );

          const containerDebugElement = fixture.debugElement.query(
            By.directive(DatetimePickerContainerComponent)
          );
          containerElement = containerDebugElement.nativeElement;
          expect(containerDebugElement.componentInstance.pickerMoment).toEqual(
            new Date(2020, JAN, 1)
          );

          const calendarBodyEl = containerElement.querySelector('.dtp-calendar-body');

          dispatchKeyboardEvent(calendarBodyEl, 'keydown', RIGHT_ARROW);
          fixture.detectChanges();
          flush();
          dispatchKeyboardEvent(calendarBodyEl, 'keydown', ENTER);
          fixture.detectChanges();
          flush();

          expect(testComponent.datetimePicker.opened).toBe(
            false,
            'Expected datetimePicker to be closed.'
          );
          expect(testComponent.datetimePickerInput.value).toEqual(new Date(2020, JAN, 2));
        }));

        it('should close popup panel when click on the selected date', fakeAsync(() => {
          testComponent.datetimePicker.open();
          fixture.detectChanges();
          flush();
          expect(testComponent.datetimePicker.opened).toBe(
            true,
            'Expected datetimePicker to be opened.'
          );

          const containerDebugElement = fixture.debugElement.query(
            By.directive(DatetimePickerContainerComponent)
          );
          containerElement = containerDebugElement.nativeElement;
          expect(containerDebugElement.componentInstance.pickerMoment).toEqual(
            new Date(2020, JAN, 1)
          );
          expect(testComponent.datetimePicker.selected).toEqual(new Date(2020, JAN, 1));

          const dateCell = containerElement.querySelector('[aria-label="January 1, 2020"]');
          dispatchMouseEvent(dateCell, 'click');
          fixture.detectChanges();
          flush();

          expect(testComponent.datetimePicker.opened).toBe(
            false,
            'Expected datetimePicker to be closed.'
          );
          expect(testComponent.datetimePickerInput.value).toEqual(new Date(2020, JAN, 1));
        }));
      });

      describe('with only timer', () => {
        beforeEach(() => {
          testComponent.pickerType = 'timer';
          fixture.detectChanges();
        });

        it('should initialize with correct value shown in input', () => {
          if (SUPPORTS_INTL) {
            expect(fixture.nativeElement.querySelector('input').value).toBe('12:00 AM');
          }
        });

        it('should have container control buttons', fakeAsync(() => {
          testComponent.datetimePicker.open();
          fixture.detectChanges();
          flush();
          expect(testComponent.datetimePicker.opened).toBe(
            true,
            'Expected datetimePicker to be opened.'
          );

          const containerDebugElement = fixture.debugElement.query(
            By.directive(DatetimePickerContainerComponent)
          );
          containerElement = containerDebugElement.nativeElement;
          const btns = containerElement.querySelectorAll('.dtp-container-control-button');

          expect(btns.length).toBe(2);
        }));
      });
    });

    describe('range DatetimePicker', () => {
      let fixture: ComponentFixture<RangeDatetimePickerComponent>;
      let testComponent: RangeDatetimePickerComponent;
      let containerElement: HTMLElement;

      beforeEach(fakeAsync(() => {
        fixture = createComponent(RangeDatetimePickerComponent, [NativeDatetimeModule]);
        fixture.detectChanges();
        testComponent = fixture.componentInstance;
      }));

      afterEach(fakeAsync(() => {
        testComponent.datetimePicker.close();
        fixture.detectChanges();
        flush();
      }));

      it('should initialize with correct value shown in input', () => {
        if (SUPPORTS_INTL) {
          expect(fixture.nativeElement.querySelector('input').value).toBe(
            '1/1/2020, 12:00 AM - 2/1/2020, 12:00 AM'
          );
        }
      });

      it('should have default activeSelectedIndex value as 0', () => {
        testComponent.datetimePicker.open();
        fixture.detectChanges();

        const containerDebugElement = fixture.debugElement.query(
          By.directive(DatetimePickerContainerComponent)
        );
        expect(containerDebugElement.componentInstance.activeSelectedIndex).toBe(0);
      });

      it('clicking the dateCell should set the rangeFrom value when both rangeFrom and rangeTo had NO value', fakeAsync(() => {
        testComponent.dates = [];
        fixture.detectChanges();

        testComponent.datetimePicker.open();
        fixture.detectChanges();
        flush();

        expect(testComponent.datetimePicker.selecteds.length).toBe(0);

        const containerDebugElement = fixture.debugElement.query(
          By.directive(DatetimePickerContainerComponent)
        );
        containerElement = containerDebugElement.nativeElement;

        const dateCell = containerElement.querySelector('[aria-label="January 2, 2020"]');
        dispatchMouseEvent(dateCell, 'click');
        fixture.detectChanges();
        flush();

        expect(containerDebugElement.componentInstance.activeSelectedIndex).toBe(0);
        expect(testComponent.datetimePicker.selecteds.length).toBe(2);
        expect(testComponent.datetimePicker.selecteds[0]).toEqual(new Date(2020, JAN, 2));
        expect(testComponent.datetimePicker.selecteds[1]).toBe(null);
      }));

      it('clicking the dateCell should set the rangeFrom value when both rangeFrom and rangeTo already had value', fakeAsync(() => {
        testComponent.datetimePicker.open();
        fixture.detectChanges();
        flush();

        expect(testComponent.datetimePicker.selecteds.length).toBe(2);

        const containerDebugElement = fixture.debugElement.query(
          By.directive(DatetimePickerContainerComponent)
        );
        containerElement = containerDebugElement.nativeElement;

        const dateCell = containerElement.querySelector('[aria-label="January 2, 2020"]');
        dispatchMouseEvent(dateCell, 'click');
        fixture.detectChanges();
        flush();

        expect(containerDebugElement.componentInstance.activeSelectedIndex).toBe(0);
        expect(testComponent.datetimePicker.selecteds.length).toBe(2);
        expect(testComponent.datetimePicker.selecteds[0]).toEqual(new Date(2020, JAN, 2));
        expect(testComponent.datetimePicker.selecteds[1]).toBe(null);
      }));

      it('clicking the dateCell should set the rangeFrom value when dateCell value is before the old rangeFrom value', fakeAsync(() => {
        testComponent.dates = [new Date(2020, JAN, 2), null];
        fixture.detectChanges();

        testComponent.datetimePicker.open();
        fixture.detectChanges();
        flush();

        expect(testComponent.datetimePicker.selecteds.length).toBe(2);

        const containerDebugElement = fixture.debugElement.query(
          By.directive(DatetimePickerContainerComponent)
        );
        containerElement = containerDebugElement.nativeElement;

        const dateCell = containerElement.querySelector('[aria-label="January 1, 2020"]');
        dispatchMouseEvent(dateCell, 'click');
        fixture.detectChanges();
        flush();

        expect(containerDebugElement.componentInstance.activeSelectedIndex).toBe(0);
        expect(testComponent.datetimePicker.selecteds.length).toBe(2);
        expect(testComponent.datetimePicker.selecteds[0]).toEqual(new Date(2020, JAN, 1));
        expect(testComponent.datetimePicker.selecteds[1]).toBe(null);
      }));

      it('clicking the dateCell should set the rangeTo value when rangeFrom already had value', fakeAsync(() => {
        testComponent.dates = [new Date(2020, JAN, 2), null];
        fixture.detectChanges();

        testComponent.datetimePicker.open();
        fixture.detectChanges();
        flush();

        expect(testComponent.datetimePicker.selecteds.length).toBe(2);

        const containerDebugElement = fixture.debugElement.query(
          By.directive(DatetimePickerContainerComponent)
        );
        containerElement = containerDebugElement.nativeElement;

        const dateCell = containerElement.querySelector('[aria-label="January 3, 2020"]');
        dispatchMouseEvent(dateCell, 'click');
        fixture.detectChanges();
        flush();

        expect(containerDebugElement.componentInstance.activeSelectedIndex).toBe(1);
        expect(testComponent.datetimePicker.selecteds.length).toBe(2);
        expect(testComponent.datetimePicker.selecteds[0]).toEqual(new Date(2020, JAN, 2));
        expect(testComponent.datetimePicker.selecteds[1]).toEqual(new Date(2020, JAN, 3));
      }));

      it('should have the container info row', () => {
        testComponent.datetimePicker.open();
        fixture.detectChanges();

        const containerDebugElement = fixture.debugElement.query(
          By.directive(DatetimePickerContainerComponent)
        );
        containerElement = containerDebugElement.nativeElement;

        const infoRow = containerElement.querySelector('.dtp-container-info');

        expect(infoRow).toBeTruthy();
      });

      it('should set the activeSelectedIndex via clicking the info row radio', fakeAsync(() => {
        testComponent.datetimePicker.open();
        fixture.detectChanges();

        const containerDebugElement = fixture.debugElement.query(
          By.directive(DatetimePickerContainerComponent)
        );
        containerElement = containerDebugElement.nativeElement;

        const radioBtns = containerElement.querySelectorAll('.dtp-container-range');

        for (let i = 0; i < radioBtns.length; i++) {
          dispatchMouseEvent(radioBtns[i], 'click');
          fixture.detectChanges();
          flush();

          expect(containerDebugElement.componentInstance.activeSelectedIndex).toBe(i);
        }
      }));

      describe('with only calendar', () => {
        beforeEach(() => {
          testComponent.pickerType = 'calendar';
          fixture.detectChanges();
        });

        it('should initialize with correct value shown in input', () => {
          if (SUPPORTS_INTL) {
            expect(fixture.nativeElement.querySelector('input').value).toBe('1/1/2020 - 2/1/2020');
          }
        });

        it('should NOT close the datetimePicker popup panel when only the rangeFrom value is selected', fakeAsync(() => {
          testComponent.dates = [];
          fixture.detectChanges();

          testComponent.datetimePicker.open();
          fixture.detectChanges();
          flush();

          expect(testComponent.datetimePicker.selecteds.length).toBe(0);

          const containerDebugElement = fixture.debugElement.query(
            By.directive(DatetimePickerContainerComponent)
          );
          containerElement = containerDebugElement.nativeElement;

          const dateCell = containerElement.querySelector('[aria-label="January 2, 2020"]');
          dispatchMouseEvent(dateCell, 'click');
          fixture.detectChanges();
          flush();

          expect(testComponent.datetimePicker.opened).toBe(
            true,
            'Expected datetimePicker to be opened.'
          );
        }));

        it('should close the datetimePicker popup panel when both the rangeFrom and the rangeTo value are selected', fakeAsync(() => {
          testComponent.dates = [];
          fixture.detectChanges();

          testComponent.datetimePicker.open();
          fixture.detectChanges();
          flush();

          expect(testComponent.datetimePicker.selecteds.length).toBe(0);

          const containerDebugElement = fixture.debugElement.query(
            By.directive(DatetimePickerContainerComponent)
          );
          containerElement = containerDebugElement.nativeElement;

          let dateCell = containerElement.querySelector('[aria-label="January 2, 2020"]');
          dispatchMouseEvent(dateCell, 'click');
          fixture.detectChanges();
          flush();

          dateCell = containerElement.querySelector('[aria-label="January 3, 2020"]');
          dispatchMouseEvent(dateCell, 'click');
          fixture.detectChanges();
          flush();

          expect(testComponent.datetimePicker.selecteds.length).toBe(2);
          expect(testComponent.datetimePicker.opened).toBe(
            false,
            'Expected datetimePicker to be closed.'
          );
        }));
      });
    });

    describe('DatetimePicker with too many inputs', () => {
      it('should throw when multiple inputs registered', fakeAsync(() => {
        const fixture = createComponent(MultiInputDatetimePickerComponent, [NativeDatetimeModule]);
        expect(() => fixture.detectChanges()).toThrow();
      }));
    });

    describe('DatetimePicker with no input', () => {
      let fixture: ComponentFixture<NoInputDatetimePickerComponent>;
      let testComponent: NoInputDatetimePickerComponent;

      beforeEach(fakeAsync(() => {
        fixture = createComponent(NoInputDatetimePickerComponent, [NativeDatetimeModule]);
        fixture.detectChanges();

        testComponent = fixture.componentInstance;
      }));

      afterEach(fakeAsync(() => {
        testComponent.datetimePicker.close();
        fixture.detectChanges();
      }));

      it('should NOT throw when accessing disabled property', () => {
        expect(() => testComponent.datetimePicker.disabled).not.toThrow();
      });

      it('should throw when opened with no registered inputs', fakeAsync(() => {
        expect(() => testComponent.datetimePicker.open()).toThrow();
      }));
    });

    describe('DatetimePicker with startAt', () => {
      let fixture: ComponentFixture<DatetimePickerWithStartAtComponent>;
      let testComponent: DatetimePickerWithStartAtComponent;

      beforeEach(fakeAsync(() => {
        fixture = createComponent(DatetimePickerWithStartAtComponent, [NativeDatetimeModule]);
        fixture.detectChanges();

        testComponent = fixture.componentInstance;
      }));

      afterEach(fakeAsync(() => {
        testComponent.datetimePicker.close();
        fixture.detectChanges();
      }));

      it('should override input value by explicit startAt', () => {
        expect(testComponent.datetimePicker.startAt).toEqual(new Date(2010, JAN, 1));
      });
    });

    describe('DatetimePicker with startView', () => {
      let fixture: ComponentFixture<DatetimePickerWithStartViewComponent>;
      let testComponent: DatetimePickerWithStartViewComponent;
      let containerDebugElement;
      let containerElement;

      beforeEach(() => {
        fixture = createComponent(DatetimePickerWithStartViewComponent, [NativeDatetimeModule]);
        fixture.detectChanges();

        testComponent = fixture.componentInstance;
      });

      afterEach(() => {
        testComponent.datetimePicker.close();
        fixture.detectChanges();
      });

      describe('set to year', () => {
        beforeEach(() => {
          testComponent.startView = 'year';
          fixture.detectChanges();
        });

        it('should start at the year view', () => {
          testComponent.datetimePicker.open();
          fixture.detectChanges();

          containerDebugElement = fixture.debugElement.query(
            By.directive(DatetimePickerContainerComponent)
          );
          containerElement = containerDebugElement.nativeElement;
          const yearTable = containerElement.querySelector('table.dtp-calendar-year-table');
          expect(yearTable).toBeTruthy();
        });

        it('should fire monthSelected when user selects calendar month in year view', fakeAsync(() => {
          spyOn(testComponent, 'onMonthSelected');
          expect(testComponent.onMonthSelected).not.toHaveBeenCalled();

          testComponent.datetimePicker.open();
          fixture.detectChanges();

          containerDebugElement = fixture.debugElement.query(
            By.directive(DatetimePickerContainerComponent)
          );
          containerElement = containerDebugElement.nativeElement;
          const cells = containerElement.querySelectorAll('.dtp-calendar-cell');

          dispatchMouseEvent(cells[0], 'click');
          fixture.detectChanges();
          flush();

          expect(testComponent.onMonthSelected).toHaveBeenCalled();
        }));
      });

      describe('set to multi-years', () => {
        beforeEach(() => {
          testComponent.startView = 'multi-years';
          fixture.detectChanges();
        });

        it('should start at the multi-years view', () => {
          testComponent.datetimePicker.open();
          fixture.detectChanges();

          containerDebugElement = fixture.debugElement.query(
            By.directive(DatetimePickerContainerComponent)
          );
          containerElement = containerDebugElement.nativeElement;
          const multiYearTable = containerElement.querySelector(
            'table.dtp-calendar-multi-year-table'
          );
          expect(multiYearTable).toBeTruthy();
        });

        it('should fire yearSelected when user selects calendar year in multi-years view', fakeAsync(() => {
          spyOn(testComponent, 'onYearSelected');
          expect(testComponent.onYearSelected).not.toHaveBeenCalled();

          testComponent.datetimePicker.open();
          fixture.detectChanges();

          containerDebugElement = fixture.debugElement.query(
            By.directive(DatetimePickerContainerComponent)
          );
          containerElement = containerDebugElement.nativeElement;
          const cells = containerElement.querySelectorAll('.dtp-calendar-cell');

          dispatchMouseEvent(cells[0], 'click');
          fixture.detectChanges();
          flush();

          expect(testComponent.onYearSelected).toHaveBeenCalled();
        }));
      });
    });

    describe('DatetimePicker with NgModel', () => {
      let fixture: ComponentFixture<DatetimePickerWithNgModelComponent>;
      let testComponent: DatetimePickerWithNgModelComponent;

      beforeEach(fakeAsync(() => {
        fixture = createComponent(DatetimePickerWithNgModelComponent, [NativeDatetimeModule]);
        fixture.detectChanges();
        fixture.whenStable().then(() => {
          fixture.detectChanges();

          testComponent = fixture.componentInstance;
        });
      }));

      afterEach(fakeAsync(() => {
        testComponent.datetimePicker.close();
        fixture.detectChanges();
        flush();
      }));

      it('should update datetimePicker when model changes', fakeAsync(() => {
        expect(testComponent.datetimePickerInput.value).toBeNull();
        expect(testComponent.datetimePicker.selected).toBeNull();

        const selected = new Date(2017, JAN, 1);
        testComponent.moment = selected;
        fixture.detectChanges();
        flush();
        fixture.detectChanges();

        expect(testComponent.datetimePickerInput.value).toEqual(selected);
        expect(testComponent.datetimePicker.selected).toEqual(selected);
      }));

      it('should update model when date is selected', fakeAsync(() => {
        expect(testComponent.moment).toBeNull();
        expect(testComponent.datetimePickerInput.value).toBeNull();

        const selected = new Date(2017, JAN, 1);
        testComponent.datetimePicker.select(selected);
        fixture.detectChanges();
        flush();
        testComponent.datetimePicker.confirmSelect();
        fixture.detectChanges();
        flush();
        fixture.detectChanges();

        expect(testComponent.moment).toEqual(selected);
        expect(testComponent.datetimePickerInput.value).toEqual(selected);
      }));

      it('should mark input dirty after input event', () => {
        const inputEl = fixture.debugElement.query(By.css('input')).nativeElement;

        expect(inputEl.classList).toContain('ng-pristine');

        inputEl.value = '2001-01-01';
        dispatchFakeEvent(inputEl, 'input');
        fixture.detectChanges();

        expect(inputEl.classList).toContain('ng-dirty');
      });

      it('should mark input dirty after date selected', fakeAsync(() => {
        const inputEl = fixture.debugElement.query(By.css('input')).nativeElement;

        expect(inputEl.classList).toContain('ng-pristine');

        testComponent.datetimePicker.select(new Date(2017, JAN, 1));
        fixture.detectChanges();
        flush();
        testComponent.datetimePicker.confirmSelect();
        fixture.detectChanges();
        flush();
        fixture.detectChanges();

        expect(inputEl.classList).toContain('ng-dirty');
      }));

      it('should not mark dirty after model change', fakeAsync(() => {
        const inputEl = fixture.debugElement.query(By.css('input')).nativeElement;

        expect(inputEl.classList).toContain('ng-pristine');

        testComponent.moment = new Date(2017, JAN, 1);
        fixture.detectChanges();
        flush();
        fixture.detectChanges();

        expect(inputEl.classList).toContain('ng-pristine');
      }));

      it('should mark input touched on blur', () => {
        const inputEl = fixture.debugElement.query(By.css('input')).nativeElement;

        expect(inputEl.classList).toContain('ng-untouched');

        dispatchFakeEvent(inputEl, 'focus');
        fixture.detectChanges();

        expect(inputEl.classList).toContain('ng-untouched');

        dispatchFakeEvent(inputEl, 'blur');
        fixture.detectChanges();

        expect(inputEl.classList).toContain('ng-touched');
      });

      it('should not reformat invalid dates on blur', () => {
        const inputEl = fixture.debugElement.query(By.css('input')).nativeElement;

        inputEl.value = 'very-valid-date';
        dispatchFakeEvent(inputEl, 'input');
        fixture.detectChanges();

        dispatchFakeEvent(inputEl, 'blur');
        fixture.detectChanges();

        expect(inputEl.value).toBe('very-valid-date');
      });

      it('should mark input touched on calendar selection', fakeAsync(() => {
        const inputEl = fixture.debugElement.query(By.css('input')).nativeElement;

        expect(inputEl.classList).toContain('ng-untouched');

        testComponent.datetimePicker.select(new Date(2017, JAN, 1));
        fixture.detectChanges();
        flush();
        testComponent.datetimePicker.confirmSelect();
        fixture.detectChanges();
        flush();
        fixture.detectChanges();

        expect(inputEl.classList).toContain('ng-touched');
      }));

      describe('with range mode', () => {
        beforeEach(() => {
          testComponent.selectMode = 'range';
          fixture.detectChanges();
          expect(testComponent.datetimePicker.selectMode).toBe('range');
        });

        it('should update datetimePicker when model changes', fakeAsync(() => {
          expect(testComponent.datetimePickerInput.values.length).toBe(0);
          expect(testComponent.datetimePicker.selecteds.length).toBe(0);

          const from = new Date(2017, JAN, 1);
          const to = new Date(2017, JAN, 3);
          testComponent.moment = [from, to];
          fixture.detectChanges();
          flush();
          fixture.detectChanges();

          expect(testComponent.datetimePickerInput.values.length).toBe(2);
          expect(testComponent.datetimePickerInput.values[0]).toEqual(from);
          expect(testComponent.datetimePickerInput.values[1]).toEqual(to);
          expect(testComponent.datetimePicker.selecteds.length).toBe(2);
          expect(testComponent.datetimePicker.selecteds[0]).toEqual(from);
          expect(testComponent.datetimePicker.selecteds[1]).toEqual(to);
        }));

        it('should update model when date is selected', fakeAsync(() => {
          expect(testComponent.moment).toBeNull();
          expect(testComponent.datetimePickerInput.values.length).toBe(0);

          const from = new Date(2017, JAN, 1);
          const to = new Date(2017, JAN, 3);
          testComponent.datetimePicker.select([from, to]);
          fixture.detectChanges();
          flush();
          testComponent.datetimePicker.confirmSelect();
          fixture.detectChanges();
          flush();
          fixture.detectChanges();

          expect(testComponent.moment[0]).toEqual(from);
          expect(testComponent.moment[1]).toEqual(to);
          expect(testComponent.datetimePickerInput.values.length).toBe(2);
          expect(testComponent.datetimePickerInput.values[0]).toEqual(from);
          expect(testComponent.datetimePickerInput.values[1]).toEqual(to);
        }));
      });

      describe('with rangeFrom mode', () => {
        beforeEach(() => {
          testComponent.selectMode = 'rangeFrom';
          fixture.detectChanges();
          expect(testComponent.datetimePicker.selectMode).toBe('rangeFrom');
        });

        it('should update datetimePicker when model changes', fakeAsync(() => {
          expect(testComponent.datetimePickerInput.values.length).toBe(0);
          expect(testComponent.datetimePicker.selecteds.length).toBe(0);

          const from = new Date(2017, JAN, 1);
          testComponent.moment = [from];
          fixture.detectChanges();
          flush();
          fixture.detectChanges();

          expect(testComponent.datetimePickerInput.values[0]).toEqual(from);
          expect(testComponent.datetimePickerInput.values[1]).toBeFalsy();
          expect(testComponent.datetimePicker.selecteds[0]).toEqual(from);
          expect(testComponent.datetimePicker.selecteds[1]).toBeFalsy();
        }));

        it('should only update fromValue when date is selected', fakeAsync(() => {
          const from = new Date(2017, JAN, 1);
          const to = new Date(2017, JAN, 3);
          testComponent.moment = [from, to];
          fixture.detectChanges();
          flush();
          fixture.detectChanges();

          testComponent.datetimePicker.open();
          fixture.detectChanges();
          flush();

          const newSelectedFrom = new Date(2017, JAN, 2);
          const containerDebugElement = fixture.debugElement.query(
            By.directive(DatetimePickerContainerComponent)
          );
          containerDebugElement.componentInstance.dateSelected(newSelectedFrom);
          fixture.detectChanges();
          flush();
          testComponent.datetimePicker.confirmSelect();
          fixture.detectChanges();
          flush();
          fixture.detectChanges();

          expect(testComponent.datetimePicker.selecteds[0]).toEqual(newSelectedFrom);
          expect(testComponent.datetimePicker.selecteds[1]).toEqual(to);
          expect(testComponent.datetimePickerInput.values[0]).toEqual(newSelectedFrom);
          expect(testComponent.datetimePickerInput.values[1]).toEqual(to);
          expect(testComponent.moment[0]).toEqual(newSelectedFrom);
          expect(testComponent.moment[1]).toEqual(to);
        }));

        it('should update fromValue and set toValue to null when date is selected after toValue', fakeAsync(() => {
          const from = new Date(2017, JAN, 1);
          const to = new Date(2017, JAN, 3);
          testComponent.moment = [from, to];
          fixture.detectChanges();
          flush();
          fixture.detectChanges();

          testComponent.datetimePicker.open();
          fixture.detectChanges();
          flush();

          const newSelectedFrom = new Date(2017, JAN, 4);
          const containerDebugElement = fixture.debugElement.query(
            By.directive(DatetimePickerContainerComponent)
          );
          containerDebugElement.componentInstance.dateSelected(newSelectedFrom);
          fixture.detectChanges();
          flush();
          testComponent.datetimePicker.confirmSelect();
          fixture.detectChanges();
          flush();
          fixture.detectChanges();

          expect(testComponent.datetimePicker.selecteds[0]).toEqual(newSelectedFrom);
          expect(testComponent.datetimePicker.selecteds[1]).toBeFalsy();
          expect(testComponent.datetimePickerInput.values[0]).toEqual(newSelectedFrom);
          expect(testComponent.datetimePickerInput.values[1]).toBeFalsy();
          expect(testComponent.moment[0]).toEqual(newSelectedFrom);
          expect(testComponent.moment[1]).toBeFalsy();
        }));
      });

      describe('with rangeTo mode', () => {
        beforeEach(() => {
          testComponent.selectMode = 'rangeTo';
          fixture.detectChanges();
          expect(testComponent.datetimePicker.selectMode).toBe('rangeTo');
        });

        it('should update datetimePicker when model changes', fakeAsync(() => {
          expect(testComponent.datetimePickerInput.values.length).toBe(0);
          expect(testComponent.datetimePicker.selecteds.length).toBe(0);

          const to = new Date(2017, JAN, 3);
          testComponent.moment = [null, to];
          fixture.detectChanges();
          flush();
          fixture.detectChanges();

          expect(testComponent.datetimePickerInput.values[0]).toBeFalsy();
          expect(testComponent.datetimePickerInput.values[1]).toEqual(to);
          expect(testComponent.datetimePicker.selecteds[0]).toBeFalsy();
          expect(testComponent.datetimePicker.selecteds[1]).toEqual(to);
        }));

        it('should only update toValue when date is selected', fakeAsync(() => {
          const from = new Date(2017, JAN, 1);
          const to = new Date(2017, JAN, 3);
          testComponent.moment = [from, to];
          fixture.detectChanges();
          flush();
          fixture.detectChanges();

          testComponent.datetimePicker.open();
          fixture.detectChanges();
          flush();

          const newSelectedTo = new Date(2017, JAN, 4);
          const containerDebugElement = fixture.debugElement.query(
            By.directive(DatetimePickerContainerComponent)
          );
          containerDebugElement.componentInstance.dateSelected(newSelectedTo);
          fixture.detectChanges();
          flush();
          testComponent.datetimePicker.confirmSelect();
          fixture.detectChanges();
          flush();
          fixture.detectChanges();

          expect(testComponent.datetimePicker.selecteds[0]).toEqual(from);
          expect(testComponent.datetimePicker.selecteds[1]).toEqual(newSelectedTo);
          expect(testComponent.datetimePickerInput.values[0]).toEqual(from);
          expect(testComponent.datetimePickerInput.values[1]).toEqual(newSelectedTo);
          expect(testComponent.moment[0]).toEqual(from);
          expect(testComponent.moment[1]).toEqual(newSelectedTo);
        }));

        it('should update toValue and set fromValue to null when date is selected before fromValue', fakeAsync(() => {
          const from = new Date(2017, JAN, 2);
          const to = new Date(2017, JAN, 3);
          testComponent.moment = [from, to];
          fixture.detectChanges();
          flush();
          fixture.detectChanges();

          testComponent.datetimePicker.open();
          fixture.detectChanges();
          flush();

          const newSelectedTo = new Date(2017, JAN, 1);
          const containerDebugElement = fixture.debugElement.query(
            By.directive(DatetimePickerContainerComponent)
          );
          containerDebugElement.componentInstance.dateSelected(newSelectedTo);
          fixture.detectChanges();
          flush();
          testComponent.datetimePicker.confirmSelect();
          fixture.detectChanges();
          flush();
          fixture.detectChanges();

          expect(testComponent.datetimePicker.selecteds[0]).toBeFalsy();
          expect(testComponent.datetimePicker.selecteds[1]).toEqual(newSelectedTo);
          expect(testComponent.datetimePickerInput.values[0]).toBeFalsy();
          expect(testComponent.datetimePickerInput.values[1]).toEqual(newSelectedTo);
          expect(testComponent.moment[0]).toBeFalsy();
          expect(testComponent.moment[1]).toEqual(newSelectedTo);
        }));
      });
    });

    describe('DatetimePicker with FormControl', () => {
      let fixture: ComponentFixture<DatetimePickerWithFormControlComponent>;
      let testComponent: DatetimePickerWithFormControlComponent;

      beforeEach(fakeAsync(() => {
        fixture = createComponent(DatetimePickerWithFormControlComponent, [NativeDatetimeModule]);
        fixture.detectChanges();

        testComponent = fixture.componentInstance;
      }));

      afterEach(fakeAsync(() => {
        testComponent.datetimePicker.close();
        fixture.detectChanges();
      }));

      it('should update datetimePicker when formControl changes', () => {
        expect(testComponent.datetimePickerInput.value).toBeNull();
        expect(testComponent.datetimePicker.selected).toBeNull();

        const selected = new Date(2017, JAN, 1);
        testComponent.formControl.setValue(selected);
        fixture.detectChanges();

        expect(testComponent.datetimePickerInput.value).toEqual(selected);
        expect(testComponent.datetimePicker.selected).toEqual(selected);
      });

      it('should update formControl when date is selected', fakeAsync(() => {
        expect(testComponent.formControl.value).toBeNull();
        expect(testComponent.datetimePickerInput.value).toBeNull();

        const selected = new Date(2017, JAN, 1);
        testComponent.datetimePicker.select(selected);
        fixture.detectChanges();
        flush();
        testComponent.datetimePicker.confirmSelect();
        fixture.detectChanges();
        flush();
        fixture.detectChanges();

        expect(testComponent.formControl.value).toEqual(selected);
        expect(testComponent.datetimePickerInput.value).toEqual(selected);
      }));

      it('should disable input when form control disabled', () => {
        const inputEl = fixture.debugElement.query(By.css('input')).nativeElement;

        expect(inputEl.disabled).toBe(false);

        testComponent.formControl.disable();
        fixture.detectChanges();

        expect(inputEl.disabled).toBe(true);
      });

      it('should disable toggle when form control disabled', () => {
        expect(testComponent.datetimePickerToggle.disabled).toBe(false);

        testComponent.formControl.disable();
        fixture.detectChanges();

        expect(testComponent.datetimePickerToggle.disabled).toBe(true);
      });
    });

    describe('DatetimePicker with ngDatetimePickerToggle', () => {
      let fixture: ComponentFixture<DatetimePickerWithTriggerComponent>;
      let testComponent: DatetimePickerWithTriggerComponent;

      beforeEach(fakeAsync(() => {
        fixture = createComponent(DatetimePickerWithTriggerComponent, [NativeDatetimeModule]);
        fixture.detectChanges();

        testComponent = fixture.componentInstance;
      }));

      afterEach(fakeAsync(() => {
        testComponent.datetimePicker.close();
        fixture.detectChanges();
        flush();
      }));

      it('should open the picker when trigger clicked', () => {
        expect(document.querySelector('ng-datetime-picker-container')).toBeNull();

        const toggle = fixture.debugElement.query(By.css('button'));
        dispatchMouseEvent(toggle.nativeElement, 'click');
        fixture.detectChanges();

        expect(document.querySelector('ng-datetime-picker-container')).not.toBeNull();
      });

      it('should not open the picker when trigger clicked if datetimePicker is disabled', () => {
        testComponent.datetimePicker.disabled = true;
        fixture.detectChanges();
        const toggle = fixture.debugElement.query(By.css('button')).nativeElement;

        expect(toggle.classList).toContain('dtp-toggle-disabled');
        expect(document.querySelector('ng-datetime-picker-container')).toBeNull();

        dispatchMouseEvent(toggle, 'click');
        fixture.detectChanges();

        expect(document.querySelector('ng-datetime-picker-container')).toBeNull();
      });

      it('should not open the picker when trigger clicked if input is disabled', () => {
        expect(testComponent.datetimePicker.disabled).toBe(false);

        testComponent.datetimePickerInput.disabled = true;
        fixture.detectChanges();
        const toggle = fixture.debugElement.query(By.css('button')).nativeElement;

        expect(toggle.classList).toContain('dtp-toggle-disabled');
        expect(document.querySelector('ng-datetime-picker-container')).toBeNull();

        dispatchMouseEvent(toggle, 'click');
        fixture.detectChanges();

        expect(document.querySelector('ng-datetime-picker-container')).toBeNull();
      });
    });

    describe('DatetimePicker with min and max validation', () => {
      let fixture: ComponentFixture<DatetimePickerWithMinAndMaxValidationComponent>;
      let testComponent: DatetimePickerWithMinAndMaxValidationComponent;
      let minMoment;
      let maxMoment;

      beforeEach(fakeAsync(() => {
        fixture = createComponent(DatetimePickerWithMinAndMaxValidationComponent, [
          NativeDatetimeModule
        ]);
        fixture.detectChanges();

        testComponent = fixture.componentInstance;

        minMoment = new Date(2010, JAN, 1, 0, 30, 30);
        maxMoment = new Date(2020, JAN, 1, 23, 30, 30);
        testComponent.min = minMoment;
        testComponent.max = maxMoment;
        fixture.detectChanges();
      }));

      afterEach(fakeAsync(() => {
        testComponent.datetimePicker.close();
        fixture.detectChanges();
        flush();
      }));

      it('should use min and max dates specified by the input', () => {
        expect(testComponent.datetimePicker.minDatetime).toEqual(minMoment);
        expect(testComponent.datetimePicker.maxDatetime).toEqual(maxMoment);
      });

      it('should mark invalid when value is before minMoment', fakeAsync(() => {
        testComponent.date = new Date(2009, DEC, 31);
        fixture.detectChanges();
        flush();
        fixture.detectChanges();

        expect(fixture.debugElement.query(By.css('input')).nativeElement.classList).toContain(
          'ng-invalid'
        );
      }));

      it('should mark invalid when value is after maxMoment', fakeAsync(() => {
        testComponent.date = new Date(2020, JAN, 2);
        fixture.detectChanges();
        flush();

        fixture.detectChanges();

        expect(fixture.debugElement.query(By.css('input')).nativeElement.classList).toContain(
          'ng-invalid'
        );
      }));

      it('should not mark invalid when value equals minMoment', fakeAsync(() => {
        testComponent.date = new Date(minMoment);
        fixture.detectChanges();
        flush();
        fixture.detectChanges();

        expect(fixture.debugElement.query(By.css('input')).nativeElement.classList).not.toContain(
          'ng-invalid'
        );
      }));

      it('should not mark invalid when value equals maxMoment', fakeAsync(() => {
        testComponent.date = new Date(maxMoment);
        fixture.detectChanges();
        flush();
        fixture.detectChanges();

        expect(fixture.debugElement.query(By.css('input')).nativeElement.classList).not.toContain(
          'ng-invalid'
        );
      }));

      it('should not mark invalid when value is between minMoment and maxMoment', fakeAsync(() => {
        testComponent.date = new Date(2010, JAN, 2);
        fixture.detectChanges();
        flush();
        fixture.detectChanges();

        expect(fixture.debugElement.query(By.css('input')).nativeElement.classList).not.toContain(
          'ng-invalid'
        );
      }));

      it('should disable all decrease-time buttons when value equals minMoment', fakeAsync(() => {
        testComponent.date = new Date(minMoment);
        fixture.detectChanges();
        flush();
        fixture.detectChanges();

        testComponent.datetimePicker.open();
        fixture.detectChanges();
        flush();
        fixture.detectChanges();
        const calendarDebugElement = fixture.debugElement.query(
          By.directive(DatetimePickerContainerComponent)
        );
        const calendarElement = calendarDebugElement.nativeElement;

        const decreaseHourBtn = calendarElement.querySelector('[aria-label="Minus a hour"]');
        const decreaseMinuteBtn = calendarElement.querySelector('[aria-label="Minus a minute"]');
        const decreaseSecondBtn = calendarElement.querySelector('[aria-label="Minus a second"]');
        expect(decreaseHourBtn.hasAttribute('disabled')).toBe(true);
        expect(decreaseMinuteBtn.hasAttribute('disabled')).toBe(true);
        expect(decreaseSecondBtn.hasAttribute('disabled')).toBe(true);
      }));

      it('should disable all increase-time buttons when value equals maxMoment', fakeAsync(() => {
        testComponent.date = new Date(maxMoment);
        fixture.detectChanges();
        flush();
        fixture.detectChanges();

        testComponent.datetimePicker.open();
        fixture.detectChanges();
        flush();
        fixture.detectChanges();
        const calendarDebugElement = fixture.debugElement.query(
          By.directive(DatetimePickerContainerComponent)
        );
        const calendarElement = calendarDebugElement.nativeElement;

        const increaseHourBtn = calendarElement.querySelector('[aria-label="Add a hour"]');
        const increaseMinuteBtn = calendarElement.querySelector('[aria-label="Add a minute"]');
        const increaseSecondBtn = calendarElement.querySelector('[aria-label="Add a second"]');
        expect(increaseHourBtn.hasAttribute('disabled')).toBe(true);
        expect(increaseMinuteBtn.hasAttribute('disabled')).toBe(true);
        expect(increaseSecondBtn.hasAttribute('disabled')).toBe(true);
      }));
    });

    describe('DatetimePicker with filter validation', () => {
      let fixture: ComponentFixture<DatetimePickerWithFilterValidationComponent>;
      let testComponent: DatetimePickerWithFilterValidationComponent;

      beforeEach(fakeAsync(() => {
        fixture = createComponent(DatetimePickerWithFilterValidationComponent, [
          NativeDatetimeModule
        ]);
        fixture.detectChanges();
        testComponent = fixture.componentInstance;
      }));

      afterEach(fakeAsync(() => {
        testComponent.datetimePicker.close();
        fixture.detectChanges();
        flush();
      }));

      it('should mark input invalid', fakeAsync(() => {
        testComponent.date = new Date(2017, JAN, 1);
        fixture.detectChanges();
        flush();
        fixture.detectChanges();

        expect(fixture.debugElement.query(By.css('input')).nativeElement.classList).toContain(
          'ng-invalid'
        );

        testComponent.date = new Date(2017, JAN, 2);
        fixture.detectChanges();
        flush();
        fixture.detectChanges();

        expect(fixture.debugElement.query(By.css('input')).nativeElement.classList).not.toContain(
          'ng-invalid'
        );
      }));

      it('should disable filtered calendar cells', fakeAsync(() => {
        testComponent.date = new Date(2017, JAN, 3);
        fixture.detectChanges();
        flush();
        fixture.detectChanges();

        testComponent.datetimePicker.open();
        fixture.detectChanges();
        flush();
        fixture.detectChanges();

        expect(document.querySelector('ng-datetime-picker-container')).not.toBeNull();

        const cellOne = document.querySelector('[aria-label="January 1, 2017"]');
        const cellTwo = document.querySelector('[aria-label="January 2, 2017"]');

        expect(cellOne.classList).toContain('dtp-calendar-cell-disabled');
        expect(cellTwo.classList).not.toContain('dtp-calendar-cell-disabled');
      }));
    });

    describe('DatetimePicker with change and input events', () => {
      let fixture: ComponentFixture<DatetimePickerWithChangeAndInputEventsComponent>;
      let testComponent: DatetimePickerWithChangeAndInputEventsComponent;
      let inputEl: HTMLInputElement;

      beforeEach(fakeAsync(() => {
        fixture = createComponent(DatetimePickerWithChangeAndInputEventsComponent, [
          NativeDatetimeModule
        ]);
        fixture.detectChanges();
        testComponent = fixture.componentInstance;
        inputEl = fixture.debugElement.query(By.css('input')).nativeElement;

        spyOn(testComponent, 'onChange');
        spyOn(testComponent, 'onInput');
        spyOn(testComponent, 'onDatetimeChange');
        spyOn(testComponent, 'onDatetimeInput');
      }));

      afterEach(fakeAsync(() => {
        testComponent.datetimePicker.close();
        fixture.detectChanges();
        flush();
      }));

      it('should fire input and datetimeInput events when user types input', () => {
        expect(testComponent.onChange).not.toHaveBeenCalled();
        expect(testComponent.onDatetimeChange).not.toHaveBeenCalled();
        expect(testComponent.onInput).not.toHaveBeenCalled();
        expect(testComponent.onDatetimeInput).not.toHaveBeenCalled();

        inputEl.value = '2001-01-01';
        dispatchFakeEvent(inputEl, 'input');
        fixture.detectChanges();

        expect(testComponent.onChange).not.toHaveBeenCalled();
        expect(testComponent.onDatetimeChange).not.toHaveBeenCalled();
        expect(testComponent.onInput).toHaveBeenCalled();
        expect(testComponent.onDatetimeInput).toHaveBeenCalled();
      });

      it('should fire change and datetimeChange events when user commits typed input', () => {
        expect(testComponent.onChange).not.toHaveBeenCalled();
        expect(testComponent.onDatetimeChange).not.toHaveBeenCalled();
        expect(testComponent.onInput).not.toHaveBeenCalled();
        expect(testComponent.onDatetimeInput).not.toHaveBeenCalled();

        dispatchFakeEvent(inputEl, 'change');
        fixture.detectChanges();

        expect(testComponent.onChange).toHaveBeenCalled();
        expect(testComponent.onDatetimeChange).toHaveBeenCalled();
        expect(testComponent.onInput).not.toHaveBeenCalled();
        expect(testComponent.onDatetimeInput).not.toHaveBeenCalled();
      });

      it('should fire datetimeChange and datetimeInput events when user selects calendar date', fakeAsync(() => {
        expect(testComponent.onChange).not.toHaveBeenCalled();
        expect(testComponent.onDatetimeChange).not.toHaveBeenCalled();
        expect(testComponent.onInput).not.toHaveBeenCalled();
        expect(testComponent.onDatetimeInput).not.toHaveBeenCalled();

        testComponent.datetimePicker.open();
        fixture.detectChanges();

        expect(document.querySelector('ng-datetime-picker-container')).not.toBeNull();

        const cells = document.querySelectorAll('.dtp-calendar-cell');
        dispatchMouseEvent(cells[0], 'click');
        fixture.detectChanges();
        flush();
        testComponent.datetimePicker.confirmSelect();
        fixture.detectChanges();
        flush();
        fixture.detectChanges();

        expect(testComponent.onChange).not.toHaveBeenCalled();
        expect(testComponent.onDatetimeChange).toHaveBeenCalled();
        expect(testComponent.onInput).not.toHaveBeenCalled();
        expect(testComponent.onDatetimeInput).toHaveBeenCalled();
      }));

      it('should fire datetimeChange and datetimeInput events when user change hour', fakeAsync(() => {
        expect(testComponent.onChange).not.toHaveBeenCalled();
        expect(testComponent.onDatetimeChange).not.toHaveBeenCalled();
        expect(testComponent.onInput).not.toHaveBeenCalled();
        expect(testComponent.onDatetimeInput).not.toHaveBeenCalled();

        testComponent.datetimePicker.open();
        fixture.detectChanges();

        expect(document.querySelector('ng-datetime-picker-container')).not.toBeNull();

        const increaseHourBtn = document.querySelector('[aria-label="Add a hour"]');
        dispatchMouseEvent(increaseHourBtn, 'click');
        fixture.detectChanges();
        flush();
        testComponent.datetimePicker.confirmSelect();
        fixture.detectChanges();
        flush();
        fixture.detectChanges();

        testComponent.datetimePicker.open();
        fixture.detectChanges();

        const decreaseHourBtn = document.querySelector('[aria-label="Minus a hour"]');
        dispatchMouseEvent(decreaseHourBtn, 'click');
        fixture.detectChanges();
        flush();
        testComponent.datetimePicker.confirmSelect();
        fixture.detectChanges();
        flush();
        fixture.detectChanges();

        expect(testComponent.onChange).not.toHaveBeenCalled();
        expect(testComponent.onDatetimeChange).toHaveBeenCalledTimes(2);
        expect(testComponent.onInput).not.toHaveBeenCalled();
        expect(testComponent.onDatetimeInput).toHaveBeenCalledTimes(2);
      }));

      it('should fire datetimeChange and datetimeInput events when user change minute', fakeAsync(() => {
        expect(testComponent.onChange).not.toHaveBeenCalled();
        expect(testComponent.onDatetimeChange).not.toHaveBeenCalled();
        expect(testComponent.onInput).not.toHaveBeenCalled();
        expect(testComponent.onDatetimeInput).not.toHaveBeenCalled();

        testComponent.datetimePicker.open();
        fixture.detectChanges();

        expect(document.querySelector('ng-datetime-picker-container')).not.toBeNull();

        const increaseMinuteBtn = document.querySelector('[aria-label="Add a minute"]');
        dispatchMouseEvent(increaseMinuteBtn, 'click');
        fixture.detectChanges();
        flush();
        testComponent.datetimePicker.confirmSelect();
        fixture.detectChanges();
        flush();
        fixture.detectChanges();

        testComponent.datetimePicker.open();
        fixture.detectChanges();

        const decreaseMinuteBtn = document.querySelector('[aria-label="Minus a minute"]');
        dispatchMouseEvent(decreaseMinuteBtn, 'click');
        fixture.detectChanges();
        flush();
        testComponent.datetimePicker.confirmSelect();
        fixture.detectChanges();
        flush();
        fixture.detectChanges();

        expect(testComponent.onChange).not.toHaveBeenCalled();
        expect(testComponent.onDatetimeChange).toHaveBeenCalledTimes(2);
        expect(testComponent.onInput).not.toHaveBeenCalled();
        expect(testComponent.onDatetimeInput).toHaveBeenCalledTimes(2);
      }));

      it('should fire datetimeChange and datetimeInput events when user change second', fakeAsync(() => {
        expect(testComponent.onChange).not.toHaveBeenCalled();
        expect(testComponent.onDatetimeChange).not.toHaveBeenCalled();
        expect(testComponent.onInput).not.toHaveBeenCalled();
        expect(testComponent.onDatetimeInput).not.toHaveBeenCalled();

        testComponent.datetimePicker.open();
        fixture.detectChanges();

        expect(document.querySelector('ng-datetime-picker-container')).not.toBeNull();

        const increaseSecondBtn = document.querySelector('[aria-label="Add a second"]');
        dispatchMouseEvent(increaseSecondBtn, 'click');
        fixture.detectChanges();
        flush();
        testComponent.datetimePicker.confirmSelect();
        fixture.detectChanges();
        flush();
        fixture.detectChanges();

        testComponent.datetimePicker.open();
        fixture.detectChanges();

        const decreaseSecondBtn = document.querySelector('[aria-label="Minus a second"]');
        dispatchMouseEvent(decreaseSecondBtn, 'click');
        fixture.detectChanges();
        flush();
        testComponent.datetimePicker.confirmSelect();
        fixture.detectChanges();
        flush();
        fixture.detectChanges();

        expect(testComponent.onChange).not.toHaveBeenCalled();
        expect(testComponent.onDatetimeChange).toHaveBeenCalledTimes(2);
        expect(testComponent.onInput).not.toHaveBeenCalled();
        expect(testComponent.onDatetimeInput).toHaveBeenCalledTimes(2);
      }));

      it('should NOT fire the datetimeInput event if the value has not changed', () => {
        expect(testComponent.onDatetimeInput).not.toHaveBeenCalled();

        inputEl.value = '12/12/2012';
        dispatchFakeEvent(inputEl, 'input');
        fixture.detectChanges();

        expect(testComponent.onDatetimeInput).toHaveBeenCalledTimes(1);
        dispatchFakeEvent(inputEl, 'input');
        fixture.detectChanges();

        expect(testComponent.onDatetimeInput).toHaveBeenCalledTimes(1);
      });
    });

    describe('DatetimePicker with ISO strings', () => {
      let fixture: ComponentFixture<DatetimePickerWithISOStringsComponent>;
      let testComponent: DatetimePickerWithISOStringsComponent;

      beforeEach(fakeAsync(() => {
        fixture = createComponent(DatetimePickerWithISOStringsComponent, [NativeDatetimeModule]);
        fixture.detectChanges();
        testComponent = fixture.componentInstance;
      }));

      afterEach(fakeAsync(() => {
        testComponent.datetimePicker.close();
        fixture.detectChanges();
        flush();
      }));

      it('should coerce ISO strings', fakeAsync(() => {
        expect(() => fixture.detectChanges()).not.toThrow();
        flush();
        fixture.detectChanges();

        expect(testComponent.datetimePicker.startAt).toEqual(new Date(2017, JUL, 1));
        expect(testComponent.datetimePickerInput.value).toEqual(new Date(2017, JUN, 1));
        expect(testComponent.datetimePickerInput.min).toEqual(new Date(2017, JAN, 1));
        expect(testComponent.datetimePickerInput.max).toEqual(new Date(2017, DEC, 31));
      }));
    });

    describe('DatetimePicker with events', () => {
      let fixture: ComponentFixture<DatetimePickerWithEventsComponent>;
      let testComponent: DatetimePickerWithEventsComponent;

      beforeEach(fakeAsync(() => {
        fixture = createComponent(DatetimePickerWithEventsComponent, [NativeDatetimeModule]);
        fixture.detectChanges();
        testComponent = fixture.componentInstance;
      }));

      afterEach(fakeAsync(() => {
        testComponent.datetimePicker.close();
        fixture.detectChanges();
        flush();
      }));

      it('should dispatch an event when a datetimePicker is opened', fakeAsync(() => {
        testComponent.datetimePicker.open();
        fixture.detectChanges();
        flush();

        expect(testComponent.openedSpy).toHaveBeenCalled();
      }));

      it('should dispatch an event when a datetimePicker is closed', fakeAsync(() => {
        testComponent.datetimePicker.open();
        fixture.detectChanges();
        flush();

        testComponent.datetimePicker.close();
        flush();
        fixture.detectChanges();

        expect(testComponent.closedSpy).toHaveBeenCalled();
      }));
    });
  });

  describe('with missing DatetimeAdapter and DATE_TIME_FORMATS', () => {
    it('should throw when created', () => {
      expect(() => createComponent(StandardDatetimePickerComponent)).toThrowError(
        /DatetimePicker: No provider found for .*/
      );
    });
  });
});

@Component({
  template: `
    <input [ngDatetimePicker]="datetimePicker" [value]="date"/>
    <ng-datetime-picker
      [opened]="opened"
      [disabled]="disabled"
      [pickerType]="pickerType"
      [pickerMode]="pickerMode"
      #datetimePicker
    ></ng-datetime-picker>
  `
})
class StandardDatetimePickerComponent {
  date: Date | null = new Date(2020, JAN, 1);
  pickerType: PickerType = 'both';
  pickerMode: PickerMode = 'popup';
  opened = false;
  disabled = false;
  @ViewChild('datetimePicker', { static: true })
  datetimePicker: DatetimePickerComponent<Date>;
  @ViewChild(DatetimePickerInputDirective, { static: true })
  datetimePickerInput: DatetimePickerInputDirective<Date>;
}

@Component({
  template: `
    <input [ngDatetimePicker]="datetimePicker" [selectMode]="selectMode" [values]="dates"/>
    <ng-datetime-picker
      [startAt]="startAt"
      [pickerType]="pickerType"
      #datetimePicker
    ></ng-datetime-picker>
  `
})
class RangeDatetimePickerComponent {
  dates: Date[] | null = [new Date(2020, JAN, 1), new Date(2020, FEB, 1)];
  selectMode: SelectMode = 'range';
  pickerType: PickerType = 'both';
  startAt = new Date(2020, JAN, 1);
  @ViewChild('datetimePicker', { static: true })
  datetimePicker: DatetimePickerComponent<Date>;
  @ViewChild(DatetimePickerInputDirective, { static: true })
  datetimePickerInput: DatetimePickerInputDirective<Date>;
}

@Component({
  template: `
    <input [ngDatetimePicker]="datetimePicker"/>
    <input [ngDatetimePicker]="datetimePicker"/>
    <ng-datetime-picker #datetimePicker></ng-datetime-picker>
  `
})
class MultiInputDatetimePickerComponent {}

@Component({
  template: `
    <ng-datetime-picker #datetimePicker></ng-datetime-picker>
  `
})
class NoInputDatetimePickerComponent {
  @ViewChild('datetimePicker', { static: true })
  datetimePicker: DatetimePickerComponent<Date>;
}

@Component({
  template: `
    <input [ngDatetimePicker]="datetimePicker" [value]="date"/>
    <ng-datetime-picker #datetimePicker [startAt]="startDate"></ng-datetime-picker>
  `
})
class DatetimePickerWithStartAtComponent {
  date = new Date(2020, JAN, 1);
  startDate = new Date(2010, JAN, 1);
  @ViewChild('datetimePicker', { static: true })
  datetimePicker: DatetimePickerComponent<Date>;
}

@Component({
  template: `
    <input [ngDatetimePicker]="datetimePicker" [value]="date"/>
    <ng-datetime-picker
      #datetimePicker
      [startView]="startView"
      (monthSelected)="onMonthSelected()"
      (yearSelected)="onYearSelected()"
    ></ng-datetime-picker>
  `
})
class DatetimePickerWithStartViewComponent {
  date = new Date(2020, JAN, 1);
  startView: ViewType = 'month';
  @ViewChild('datetimePicker', { static: true })
  datetimePicker: DatetimePickerComponent<Date>;

  onMonthSelected() {}

  onYearSelected() {}
}

@Component({
  template: `
    <input [ngDatetimePicker]="datetimePicker" [selectMode]="selectMode" [(ngModel)]="moment"/>
    <ng-datetime-picker #datetimePicker></ng-datetime-picker>
  `
})
class DatetimePickerWithNgModelComponent {
  moment: Date[] | Date | null = null;
  selectMode: SelectMode = 'single';
  @ViewChild('datetimePicker', { static: true })
  datetimePicker: DatetimePickerComponent<Date>;
  @ViewChild(DatetimePickerInputDirective, { static: true })
  datetimePickerInput: DatetimePickerInputDirective<Date>;
}

@Component({
  template: `
    <input
      [formControl]="formControl"
      [ngDatetimePicker]="datetimePicker"
      [ngDatetimePickerToggle]="datetimePicker"
    />
    <ng-datetime-picker #datetimePicker></ng-datetime-picker>
  `
})
class DatetimePickerWithFormControlComponent {
  formControl = new FormControl();
  @ViewChild('datetimePicker', { static: true })
  datetimePicker: DatetimePickerComponent<Date>;
  @ViewChild(DatetimePickerInputDirective, { static: true })
  datetimePickerInput: DatetimePickerInputDirective<Date>;
  @ViewChild(DatetimePickerToggleDirective, { static: true })
  datetimePickerToggle: DatetimePickerToggleDirective<Date>;
}

@Component({
  template: `
    <input [ngDatetimePicker]="datetimePicker"/>
    <button [ngDatetimePickerToggle]="datetimePicker">Icon</button>
    <ng-datetime-picker #datetimePicker></ng-datetime-picker>
  `
})
class DatetimePickerWithTriggerComponent {
  @ViewChild('datetimePicker', { static: true })
  datetimePicker: DatetimePickerComponent<Date>;
  @ViewChild(DatetimePickerInputDirective, { static: true })
  datetimePickerInput: DatetimePickerInputDirective<Date>;
}

@Component({
  template: `
    <input
      [ngDatetimePicker]="datetimePicker"
      [ngDatetimePickerToggle]="datetimePicker"
      [min]="min"
      [max]="max"
      [(ngModel)]="date"
    />
    <ng-datetime-picker [showSecondsTimer]="true" #datetimePicker></ng-datetime-picker>
  `
})
class DatetimePickerWithMinAndMaxValidationComponent {
  @ViewChild('datetimePicker', { static: true })
  datetimePicker: DatetimePickerComponent<Date>;
  @ViewChild(DatetimePickerInputDirective, { static: true })
  datetimePickerInput: DatetimePickerInputDirective<Date>;
  @ViewChild(DatetimePickerToggleDirective, { static: true })
  datetimePickerToggle: DatetimePickerToggleDirective<Date>;

  date: Date | null;
  min: Date;
  max: Date;
}

@Component({
  template: `
    <input
      [(ngModel)]="date"
      [ngDatetimePickerFilter]="filter"
      [ngDatetimePicker]="datetimePicker"
      [ngDatetimePickerToggle]="datetimePicker"
    />
    <ng-datetime-picker [showSecondsTimer]="true" #datetimePicker></ng-datetime-picker>
  `
})
class DatetimePickerWithFilterValidationComponent {
  @ViewChild('datetimePicker', { static: true })
  datetimePicker: DatetimePickerComponent<Date>;
  @ViewChild(DatetimePickerInputDirective, { static: true })
  datetimePickerInput: DatetimePickerInputDirective<Date>;
  @ViewChild(DatetimePickerToggleDirective, { static: true })
  datetimePickerToggle: DatetimePickerToggleDirective<Date>;
  date: Date;
  filter = (date: Date) => date.getDate() !== 1;
}

@Component({
  template: `
    <input
      [ngDatetimePicker]="datetimePicker"
      [ngDatetimePickerToggle]="datetimePicker"
      (change)="onChange()"
      (input)="onInput()"
      (datetimeChange)="onDatetimeChange()"
      (datetimeInput)="onDatetimeInput()"
    />
    <ng-datetime-picker [showSecondsTimer]="true" #datetimePicker></ng-datetime-picker>
  `
})
class DatetimePickerWithChangeAndInputEventsComponent {
  @ViewChild('datetimePicker', { static: true })
  datetimePicker: DatetimePickerComponent<Date>;
  @ViewChild(DatetimePickerInputDirective, { static: true })
  datetimePickerInput: DatetimePickerInputDirective<Date>;
  @ViewChild(DatetimePickerToggleDirective, { static: true })
  datetimePickerToggle: DatetimePickerToggleDirective<Date>;

  onChange() {}

  onInput() {}

  onDatetimeChange() {}

  onDatetimeInput() {}
}

@Component({
  template: `
    <input [ngDatetimePicker]="datetimePicker" [(ngModel)]="value" [min]="min" [max]="max"/>
    <ng-datetime-picker #datetimePicker [startAt]="startAt"></ng-datetime-picker>
  `
})
class DatetimePickerWithISOStringsComponent {
  value = new Date(2017, JUN, 1).toISOString();
  min = new Date(2017, JAN, 1).toISOString();
  max = new Date(2017, DEC, 31).toISOString();
  startAt = new Date(2017, JUL, 1).toISOString();
  @ViewChild('datetimePicker', { static: true })
  datetimePicker: DatetimePickerComponent<Date>;
  @ViewChild(DatetimePickerInputDirective, { static: true })
  datetimePickerInput: DatetimePickerInputDirective<Date>;
}

@Component({
  template: `
    <input [(ngModel)]="selected" [ngDatetimePicker]="datetimePicker"/>
    <ng-datetime-picker
      (datetimePickerOpened)="openedSpy()"
      (datetimePickerClosed)="closedSpy()"
      #datetimePicker
    ></ng-datetime-picker>
  `
})
class DatetimePickerWithEventsComponent {
  selected: Date | null = null;
  openedSpy = jasmine.createSpy('opened spy');
  closedSpy = jasmine.createSpy('closed spy');
  @ViewChild('datetimePicker', { static: true })
  datetimePicker: DatetimePickerComponent<Date>;
}
