import {
  AfterContentInit,
  ChangeDetectorRef,
  Directive,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges
} from '@angular/core';
import { merge, of as observableOf, Subscription } from 'rxjs';
import { DatetimePickerComponent } from './datetime-picker.component';

@Directive({
  selector: '[ngDatetimePickerToggle]',
  exportAs: 'ngDatetimePickerToggle',
  // tslint:disable-next-line:no-host-metadata-property
  host: {
    '(click)': 'onClick($event)',
    '[class.dtp-toggle-disabled]': 'toggleDisabledClass'
  }
})
export class DatetimePickerToggleDirective<T>
  implements OnInit, OnChanges, AfterContentInit, OnDestroy {
  @Input('ngDatetimePickerToggle') datetimePicker: DatetimePickerComponent<T>;

  private _disabled: boolean;
  @Input()
  get disabled(): boolean {
    return this._disabled === undefined ? this.datetimePicker.disabled : !!this._disabled;
  }

  set disabled(value: boolean) {
    this._disabled = value;
  }

  get toggleDisabledClass(): boolean {
    return this.disabled;
  }

  private stateChanges = Subscription.EMPTY;

  constructor(protected changeDetector: ChangeDetectorRef) {}

  public ngOnInit(): void {}

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.datepicker) {
      this.watchStateChanges();
    }
  }

  public ngAfterContentInit() {
    this.watchStateChanges();
  }

  public ngOnDestroy(): void {
    this.stateChanges.unsubscribe();
  }

  public onClick(event: Event): void {
    if (this.datetimePicker) {
      this.datetimePicker.open();
      event.stopPropagation();
    }
  }

  private watchStateChanges(): void {
    this.stateChanges.unsubscribe();

    const inputDisabled =
      this.datetimePicker && this.datetimePicker.dtInput
        ? this.datetimePicker.dtInput.disabledChange
        : observableOf();

    const pickerDisabled = this.datetimePicker
      ? this.datetimePicker.disabledChange
      : observableOf();

    this.stateChanges = merge(pickerDisabled, inputDisabled).subscribe(() => {
      this.changeDetector.markForCheck();
    });
  }
}
