import { NgModule } from '@angular/core';
import { PlatformModule } from '@angular/cdk/platform';
import { DatetimeAdapter } from '../datetime-adapter.class';
import { NativeDatetimeAdapter } from './native-datetime-adapter.class';
import { DATETIME_FORMATS } from '../datetime-format.class';
import { NATIVE_DATETIME_FORMATS } from './native-datetime-format.class';

@NgModule({
  imports: [PlatformModule],
  providers: [
    { provide: DatetimeAdapter, useClass: NativeDatetimeAdapter },
    {
      provide: DATETIME_FORMATS,
      useValue: NATIVE_DATETIME_FORMATS
    }
  ]
})
export class NativeDatetimeModule {}
