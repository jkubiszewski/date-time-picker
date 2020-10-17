import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { A11yModule } from '@angular/cdk/a11y';
import { OverlayModule } from '@angular/cdk/overlay';
import { DatetimePickerToggleDirective } from './datetime-picker-toggle.directive';
import {
  DATETIME_PICKER_SCROLL_STRATEGY_PROVIDER,
  DatetimePickerComponent
} from './datetime-picker.component';
import { DatetimePickerContainerComponent } from './datetime-picker-container.component';
import { DatetimePickerInputDirective } from './datetime-picker-input.directive';
import { DatetimePickerIntl } from './datetime-picker-intl.service';
import { MonthViewComponent } from './month-view.component';
import { CalendarBodyComponent } from './calendar-body.component';
import { YearViewComponent } from './year-view.component';
import { MultiYearViewComponent } from './multi-year-view.component';
import { TimerContainerComponent } from './timer-container.component';
import { TimerComponent } from './timer.component';
import { LeftPadPipe } from './left-pad.pipe';
import { CalendarComponent } from './calendar.component';
import { DatetimePickerInlineComponent } from './datetime-picker-inline.component';
import { DialogModule } from './dialog/dialog.module';

@NgModule({
  imports: [CommonModule, OverlayModule, DialogModule, A11yModule],
  exports: [
    CalendarComponent,
    TimerComponent,
    DatetimePickerToggleDirective,
    DatetimePickerInputDirective,
    DatetimePickerComponent,
    DatetimePickerInlineComponent,
    MultiYearViewComponent,
    YearViewComponent,
    MonthViewComponent
  ],
  declarations: [
    DatetimePickerToggleDirective,
    DatetimePickerInputDirective,
    DatetimePickerComponent,
    DatetimePickerContainerComponent,
    MultiYearViewComponent,
    YearViewComponent,
    MonthViewComponent,
    TimerComponent,
    TimerContainerComponent,
    CalendarComponent,
    CalendarBodyComponent,
    LeftPadPipe,
    DatetimePickerInlineComponent
  ],
  providers: [DatetimePickerIntl, DATETIME_PICKER_SCROLL_STRATEGY_PROVIDER]
})
export class DatetimePickerModule {}
