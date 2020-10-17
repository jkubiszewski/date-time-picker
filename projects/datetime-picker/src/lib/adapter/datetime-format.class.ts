import { InjectionToken } from '@angular/core';

export interface DatetimeFormats {
  parse: {
    datetimeInput: any;
  };
  display: {
    fullInput: any;
    dateInput: any;
    timeInput: any;
    monthYearLabel: any;
    dateA11yLabel: any;
    monthYearA11yLabel: any;
  };
}

/** InjectionToken for datetime picker that can be used to override default format. */
export const DATETIME_FORMATS = new InjectionToken<DatetimeFormats>(
  'DATETIME_FORMATS'
);
