import { DatetimeFormats } from '../datetime-format.class';

export const NATIVE_DATETIME_FORMATS: DatetimeFormats = {
  parse: {
    datetimeInput: null
  },
  display: {
    fullInput: {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    },
    dateInput: { year: 'numeric', month: 'numeric', day: 'numeric' },
    timeInput: { hour: 'numeric', minute: 'numeric' },
    monthYearLabel: { year: 'numeric', month: 'short' },
    dateA11yLabel: { year: 'numeric', month: 'long', day: 'numeric' },
    monthYearA11yLabel: { year: 'numeric', month: 'long' }
  }
};
