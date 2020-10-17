import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { LOCALE_ID, NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AppComponent } from './app.component';

import { registerLocaleData } from '@angular/common';
import localePl from '@angular/common/locales/pl';
import { DatetimePickerModule } from '../../../datetime-picker/src/lib/datetime-picker.module';
import { NativeDatetimeModule } from '../../../datetime-picker/src/lib/adapter/native';

registerLocaleData(localePl);

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    DatetimePickerModule,
    NativeDatetimeModule
  ],
  providers: [{ provide: LOCALE_ID, useValue: 'pl' }],
  bootstrap: [AppComponent]
})
export class AppModule {}
