import { NgModule } from '@angular/core';
import { MOMENT_DATETIME_ADAPTER_OPTIONS, MomentDatetimeAdapter } from './moment-datetime-adapter.class';
import { MOMENT_DATETIME_FORMATS } from './moment-datetime-format.class';
import { DATETIME_LOCALE, DatetimeAdapter } from '../datetime-adapter.class';
import { DATETIME_FORMATS } from '../datetime-format.class';

@NgModule({
  providers: [
    {
      provide: DatetimeAdapter,
      useClass: MomentDatetimeAdapter,
      deps: [DATETIME_LOCALE, MOMENT_DATETIME_ADAPTER_OPTIONS]
    },
    {
      provide: DATETIME_FORMATS,
      useValue: MOMENT_DATETIME_FORMATS
    }
  ]
})
export class MomentDatetimeModule {}
