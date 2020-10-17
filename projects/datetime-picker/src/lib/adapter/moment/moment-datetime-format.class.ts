import { DatetimeFormats } from '../datetime-format.class';

export const MOMENT_DATETIME_FORMATS: DatetimeFormats = {
  parse: {
    datetimeInput: 'l LT'
  },
  display: {
    fullInput: 'l LT',
    dateInput: 'l',
    timeInput: 'LT',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY'
  }
};
