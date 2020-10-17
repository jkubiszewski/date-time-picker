import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { DOWN_ARROW } from '@angular/cdk/keycodes';
import {
  AfterContentInit,
  Directive,
  ElementRef,
  EventEmitter,
  forwardRef,
  Inject,
  Input,
  OnDestroy,
  OnInit,
  Optional,
  Output,
  Renderer2
} from '@angular/core';
import {
  AbstractControl,
  ControlValueAccessor,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ValidationErrors,
  Validator,
  ValidatorFn,
  Validators
} from '@angular/forms';
import { Subscription } from 'rxjs';
import { DatetimeAdapter } from './adapter/datetime-adapter.class';
import { DATETIME_FORMATS, DatetimeFormats } from './adapter/datetime-format.class';
import { DatetimePickerComponent } from './datetime-picker.component';
import { SelectMode } from './datetime-picker.class';

export const DATETIME_VALUE_ACCESSOR: any = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => DatetimePickerInputDirective),
  multi: true
};

export const DATETIME_VALIDATORS: any = {
  provide: NG_VALIDATORS,
  useExisting: forwardRef(() => DatetimePickerInputDirective),
  multi: true
};

@Directive({
  selector: 'input[ngDatetimePicker]',
  exportAs: 'ngDatetimePickerInput',
  // tslint:disable-next-line:no-host-metadata-property
  host: {
    '(keydown)': 'handleKeydownOnHost($event)',
    '(blur)': 'handleBlurOnHost($event)',
    '(input)': 'handleInputOnHost($event)',
    '(change)': 'onDatetimeChange($event)',
    '[attr.aria-haspopup]': 'datetimeInputAriaHaspopup',
    '[attr.aria-owns]': 'datetimeInputAriaOwns',
    '[attr.min]': 'minIso8601',
    '[attr.max]': 'maxIso8601',
    '[disabled]': 'datetimeInputDisabled'
  },
  providers: [DATETIME_VALUE_ACCESSOR, DATETIME_VALIDATORS]
})
export class DatetimePickerInputDirective<T>
  implements OnInit, AfterContentInit, OnDestroy, ControlValueAccessor, Validator {
  /**
   * The date time picker that this input is associated with.
   */
  @Input()
  set ngDatetimePicker(value: DatetimePickerComponent<T>) {
    this.registerDatetimePicker(value);
  }
  /** The datetime picker that this input is associated with. */
  public datetimePicker: DatetimePickerComponent<T>;

  /**
   * A function to filter date time
   */
  @Input()
  set ngDatetimePickerFilter(filter: (date: T | null) => boolean) {
    this.datetimeFilter = filter;
    this.validatorOnChange();
  }

  private datetimeFilter: (date: T | null) => boolean;
  get ngDatetimePickerFilter() {
    return this.datetimeFilter;
  }

  /** Whether the date time picker's input is disabled. */
  @Input()
  private _disabled: boolean;
  get disabled() {
    return !!this._disabled;
  }

  set disabled(value: boolean) {
    const newValue = coerceBooleanProperty(value);
    const element = this.elmRef.nativeElement;

    if (this._disabled !== newValue) {
      this._disabled = newValue;
      this.disabledChange.emit(newValue);
    }

    // We need to null check the `blur` method, because it's undefined during SSR.
    if (newValue && element.blur) {
      // Normally, native input elements automatically blur if they turn disabled. This behavior
      // is problematic, because it would mean that it triggers another change detection cycle,
      // which then causes a changed after checked error if the input element was focused before.
      element.blur();
    }
  }

  /** The minimum valid date. */
  private _min: T | null;
  @Input()
  get min(): T | null {
    return this._min;
  }

  set min(value: T | null) {
    this._min = this.getValidDate(this.datetimeAdapter.deserialize(value));
    this.validatorOnChange();
  }

  /** The maximum valid date. */
  private _max: T | null;
  @Input()
  get max(): T | null {
    return this._max;
  }

  set max(value: T | null) {
    this._max = this.getValidDate(this.datetimeAdapter.deserialize(value));
    this.validatorOnChange();
  }

  /**
   * The picker's select mode
   */
  private _selectMode: SelectMode = 'single';
  @Input()
  get selectMode() {
    return this._selectMode;
  }

  set selectMode(mode: SelectMode) {
    if (mode !== 'single' && mode !== 'range' && mode !== 'rangeFrom' && mode !== 'rangeTo') {
      throw Error('Datetime Error: invalid selectMode value!');
    }

    this._selectMode = mode;
  }

  /**
   * The character to separate the 'from' and 'to' in input value
   */
  @Input()
  rangeSeparator = '-';

  /** The value of the input. */
  private _value: T | null;
  @Input()
  get value(): T | null {
    return this._value;
  }
  set value(value: T | null) {
    value = this.datetimeAdapter.deserialize(value);
    this.lastValueValid = !value || this.datetimeAdapter.isValid(value);
    value = this.getValidDate(value);
    const oldDate = this._value;
    this._value = value;

    // set the input property 'value'
    this.formatNativeInputValue();

    // check if the input value changed
    if (!this.datetimeAdapter.sameDate(oldDate, value)) {
      this.valueChange.emit(value);
    }
  }

  private _values: T[] = [];
  @Input()
  get values(): T[] {
    return this._values;
  }

  set values(values: T[]) {
    if (values && values.length > 0) {
      this._values = values.map(v => {
        v = this.datetimeAdapter.deserialize(v);
        return this.getValidDate(v);
      });
      this.lastValueValid =
        (!this._values[0] || this.datetimeAdapter.isValid(this._values[0])) &&
        (!this._values[1] || this.datetimeAdapter.isValid(this._values[1]));
    } else {
      this._values = [];
      this.lastValueValid = true;
    }

    // set the input property 'value'
    this.formatNativeInputValue();

    this.valueChange.emit(this._values);
  }

  /**
   * Callback to invoke when `change` event is fired on this `<input>`
   */
  @Output()
  datetimeChange = new EventEmitter<any>();

  /**
   * Callback to invoke when an `input` event is fired on this `<input>`.
   */
  @Output()
  datetimeInput = new EventEmitter<any>();

  get elementRef(): ElementRef {
    return this.elmRef;
  }

  get isInSingleMode(): boolean {
    return this._selectMode === 'single';
  }

  get isInRangeMode(): boolean {
    return (
      this._selectMode === 'range' ||
      this._selectMode === 'rangeFrom' ||
      this._selectMode === 'rangeTo'
    );
  }

  private dtPickerSub: Subscription = Subscription.EMPTY;
  private localeSub: Subscription = Subscription.EMPTY;

  private lastValueValid = true;

  private onModelChange = (date: T[] | T) => {};
  private onModelTouched = () => {};
  private validatorOnChange = () => {};

  /** The form control validator for whether the input parses. */
  private parseValidator: ValidatorFn = (): ValidationErrors | null => {
    return this.lastValueValid
      ? null
      : { datetimeParse: { text: this.elmRef.nativeElement.value } };
  };

  /** The form control validator for the min date. */
  private minValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    if (this.isInSingleMode) {
      const controlValue = this.getValidDate(this.datetimeAdapter.deserialize(control.value));
      return !this.min ||
        !controlValue ||
        this.datetimeAdapter.compareDate(this.min, controlValue) <= 0
        ? null
        : { datetimeMin: { min: this.min, actual: controlValue } };
    } else if (this.isInRangeMode && control.value) {
      const controlValueFrom = this.getValidDate(
        this.datetimeAdapter.deserialize(control.value[0])
      );
      const controlValueTo = this.getValidDate(this.datetimeAdapter.deserialize(control.value[1]));
      return !this.min ||
        !controlValueFrom ||
        !controlValueTo ||
        this.datetimeAdapter.compareDate(this.min, controlValueFrom) <= 0
        ? null
        : {
            datetimeMin: {
              min: this.min,
              actual: [controlValueFrom, controlValueTo]
            }
          };
    }
  };

  /** The form control validator for the max date. */
  private maxValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    if (this.isInSingleMode) {
      const controlValue = this.getValidDate(this.datetimeAdapter.deserialize(control.value));
      return !this.max ||
        !controlValue ||
        this.datetimeAdapter.compareDate(this.max, controlValue) >= 0
        ? null
        : { datetimeMax: { max: this.max, actual: controlValue } };
    } else if (this.isInRangeMode && control.value) {
      const controlValueFrom = this.getValidDate(
        this.datetimeAdapter.deserialize(control.value[0])
      );
      const controlValueTo = this.getValidDate(this.datetimeAdapter.deserialize(control.value[1]));
      return !this.max ||
        !controlValueFrom ||
        !controlValueTo ||
        this.datetimeAdapter.compareDate(this.max, controlValueTo) >= 0
        ? null
        : {
            datetimeMax: {
              max: this.max,
              actual: [controlValueFrom, controlValueTo]
            }
          };
    }
  };

  /** The form control validator for the date filter. */
  private filterValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    const controlValue = this.getValidDate(this.datetimeAdapter.deserialize(control.value));
    return !this.datetimeFilter || !controlValue || this.datetimeFilter(controlValue)
      ? null
      : { datetimeFilter: true };
  };

  /**
   * The form control validator for the range.
   * Check whether the 'before' value is before the 'to' value
   */
  private rangeValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    if (this.isInSingleMode || !control.value) {
      return null;
    }

    const controlValueFrom = this.getValidDate(this.datetimeAdapter.deserialize(control.value[0]));
    const controlValueTo = this.getValidDate(this.datetimeAdapter.deserialize(control.value[1]));

    return !controlValueFrom ||
      !controlValueTo ||
      this.datetimeAdapter.compareDate(controlValueFrom, controlValueTo) <= 0
      ? null
      : { datetimeRange: true };
  };

  /** The combined form control validator for this input. */
  private validator: ValidatorFn | null = Validators.compose([
    this.parseValidator,
    this.minValidator,
    this.maxValidator,
    this.filterValidator,
    this.rangeValidator
  ]);

  /** Emits when the value changes (either due to user input or programmatic change). */
  valueChange = new EventEmitter<T[] | T | null>();

  /** Emits when the disabled state has changed */
  disabledChange = new EventEmitter<boolean>();

  get datetimeInputAriaHaspopup(): boolean {
    return true;
  }

  get datetimeInputAriaOwns(): string {
    return (this.datetimePicker.opened && this.datetimePicker.id) || null;
  }

  get minIso8601(): string {
    return this.min ? this.datetimeAdapter.toIso8601(this.min) : null;
  }

  get maxIso8601(): string {
    return this.max ? this.datetimeAdapter.toIso8601(this.max) : null;
  }

  get datetimeInputDisabled(): boolean {
    return this.disabled;
  }

  constructor(
    private elmRef: ElementRef,
    private renderer: Renderer2,
    @Optional() private datetimeAdapter: DatetimeAdapter<T>,
    @Optional()
    @Inject(DATETIME_FORMATS)
    private datetimeFormats: DatetimeFormats
  ) {
    if (!this.datetimeAdapter) {
      throw Error(
        `DatetimePicker: No provider found for DatetimePicker. You must import one of the following ` +
          `modules at your application root: NativeDatetimeModule, MomentDatetimeModule, or provide a ` +
          `custom implementation.`
      );
    }

    if (!this.datetimeFormats) {
      throw Error(
        `DatetimePicker: No provider found for DATE_TIME_FORMATS. You must import one of the following ` +
          `modules at your application root: NativeDatetimeModule, MomentDateTimeModule, or provide a ` +
          `custom implementation.`
      );
    }

    this.localeSub = this.datetimeAdapter.localeChanges.subscribe(() => {
      this.value = this.value;
    });
  }

  public ngOnInit(): void {
    if (!this.datetimePicker) {
      throw Error(
        `DatetimePicker: the picker input doesn't have any associated datetime component`
      );
    }
  }

  public ngAfterContentInit(): void {
    this.dtPickerSub = this.datetimePicker.confirmSelectedChange.subscribe((selecteds: T[] | T) => {
      if (Array.isArray(selecteds)) {
        this.values = selecteds;
      } else {
        this.value = selecteds;
      }

      this.onModelChange(selecteds);
      this.onModelTouched();
      this.datetimeChange.emit({
        source: this,
        value: selecteds,
        input: this.elmRef.nativeElement
      });
      this.datetimeInput.emit({
        source: this,
        value: selecteds,
        input: this.elmRef.nativeElement
      });
    });
  }

  public ngOnDestroy(): void {
    this.dtPickerSub.unsubscribe();
    this.localeSub.unsubscribe();
    this.valueChange.complete();
    this.disabledChange.complete();
  }

  public writeValue(value: any): void {
    if (this.isInSingleMode) {
      this.value = value;
    } else {
      this.values = value;
    }
  }

  public registerOnChange(fn: any): void {
    this.onModelChange = fn;
  }

  public registerOnTouched(fn: any): void {
    this.onModelTouched = fn;
  }

  public setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  public validate(c: AbstractControl): { [key: string]: any } {
    return this.validator ? this.validator(c) : null;
  }

  public registerOnValidatorChange(fn: () => void): void {
    this.validatorOnChange = fn;
  }

  /**
   * Open the picker when user hold alt + DOWN_ARROW
   */
  public handleKeydownOnHost(event: KeyboardEvent): void {
    if (event.altKey && event.keyCode === DOWN_ARROW) {
      this.datetimePicker.open();
      event.preventDefault();
    }
  }

  public handleBlurOnHost(event: Event): void {
    this.onModelTouched();
  }

  public handleInputOnHost(event: any): void {
    const value = event.target.value;
    if (this._selectMode === 'single') {
      this.changeInputInSingleMode(value);
    } else if (this._selectMode === 'range') {
      this.changeInputInRangeMode(value);
    } else {
      this.changeInputInRangeFromToMode(value);
    }
  }

  public onDatetimeChange(event: any): void {
    let v;
    if (this.isInSingleMode) {
      v = this.value;
    } else if (this.isInRangeMode) {
      v = this.values;
    }

    this.datetimeChange.emit({
      source: this,
      value: v,
      input: this.elmRef.nativeElement
    });
  }

  /**
   * Set the native input property 'value'
   */
  public formatNativeInputValue(): void {
    if (this.isInSingleMode) {
      this.renderer.setProperty(
        this.elmRef.nativeElement,
        'value',
        this._value ? this.datetimeAdapter.format(this._value, this.datetimePicker.formatString) : ''
      );
    } else if (this.isInRangeMode) {
      if (this._values && this.values.length > 0) {
        const from = this._values[0];
        const to = this._values[1];

        const fromFormatted = from
          ? this.datetimeAdapter.format(from, this.datetimePicker.formatString)
          : '';
        const toFormatted = to ? this.datetimeAdapter.format(to, this.datetimePicker.formatString) : '';

        if (!fromFormatted && !toFormatted) {
          this.renderer.setProperty(this.elmRef.nativeElement, 'value', null);
        } else {
          if (this._selectMode === 'range') {
            this.renderer.setProperty(
              this.elmRef.nativeElement,
              'value',
              `${fromFormatted} ${this.rangeSeparator} ${toFormatted}`
            );
          } else if (this._selectMode === 'rangeFrom') {
            this.renderer.setProperty(this.elmRef.nativeElement, 'value', fromFormatted);
          } else if (this._selectMode === 'rangeTo') {
            this.renderer.setProperty(this.elmRef.nativeElement, 'value', toFormatted);
          }
        }
      } else {
        this.renderer.setProperty(this.elmRef.nativeElement, 'value', '');
      }
    }

    return;
  }

  /**
   * Register the relationship between this input and its picker component
   */
  private registerDatetimePicker(picker: DatetimePickerComponent<T>) {
    if (picker) {
      this.datetimePicker = picker;
      this.datetimePicker.registerInput(this);
    }
  }

  /**
   * Convert a given obj to a valid date object
   */
  private getValidDate(obj: any): T | null {
    return this.datetimeAdapter.isDateInstance(obj) && this.datetimeAdapter.isValid(obj)
      ? obj
      : null;
  }

  /**
   * Convert a time string to a datetime string
   * When pickerType is 'timer', the value in the picker's input is a time string.
   * The datetimeAdapter parse fn could not parse a time string to a Date Object.
   * Therefore we need this fn to convert a time string to a datetime string.
   */
  private convertTimeStringToDatetimeString(timeString: string, datetime: T): string | null {
    if (timeString) {
      const v = datetime || this.datetimeAdapter.now();
      const dateString = this.datetimeAdapter.format(v, this.datetimeFormats.display.dateInput);
      return dateString + ' ' + timeString;
    } else {
      return null;
    }
  }

  /**
   * Handle input change in single mode
   */
  private changeInputInSingleMode(inputValue: string): void {
    let value = inputValue;
    if (this.datetimePicker.pickerType === 'timer') {
      value = this.convertTimeStringToDatetimeString(value, this.value);
    }

    let result = this.datetimeAdapter.parse(value, this.datetimeFormats.parse.datetimeInput);
    this.lastValueValid = !result || this.datetimeAdapter.isValid(result);
    result = this.getValidDate(result);

    // if the newValue is the same as the oldValue, we intend to not fire the valueChange event
    // result equals to null means there is input event, but the input value is invalid
    if (!this.datetimeAdapter.sameDate(result, this._value) || result === null) {
      this._value = result;
      this.valueChange.emit(result);
      this.onModelChange(result);
      this.datetimeInput.emit({
        source: this,
        value: result,
        input: this.elmRef.nativeElement
      });
    }
  }

  /**
   * Handle input change in rangeFrom or rangeTo mode
   */
  private changeInputInRangeFromToMode(inputValue: string): void {
    const originalValue = this._selectMode === 'rangeFrom' ? this._values[0] : this._values[1];

    if (this.datetimePicker.pickerType === 'timer') {
      inputValue = this.convertTimeStringToDatetimeString(inputValue, originalValue);
    }

    let result = this.datetimeAdapter.parse(inputValue, this.datetimeFormats.parse.datetimeInput);
    this.lastValueValid = !result || this.datetimeAdapter.isValid(result);
    result = this.getValidDate(result);

    // if the newValue is the same as the oldValue, we intend to not fire the valueChange event
    if (
      (this._selectMode === 'rangeFrom' &&
        this.datetimeAdapter.sameDate(result, this._values[0]) &&
        result) ||
      (this._selectMode === 'rangeTo' &&
        this.datetimeAdapter.sameDate(result, this._values[1]) &&
        result)
    ) {
      return;
    }

    this._values =
      this._selectMode === 'rangeFrom' ? [result, this._values[1]] : [this._values[0], result];
    this.valueChange.emit(this._values);
    this.onModelChange(this._values);
    this.datetimeInput.emit({
      source: this,
      value: this._values,
      input: this.elmRef.nativeElement
    });
  }

  /**
   * Handle input change in range mode
   */
  private changeInputInRangeMode(inputValue: string): void {
    const selecteds = inputValue.split(this.rangeSeparator);
    let fromString = selecteds[0];
    let toString = selecteds[1];

    if (this.datetimePicker.pickerType === 'timer') {
      fromString = this.convertTimeStringToDatetimeString(fromString, this.values[0]);
      toString = this.convertTimeStringToDatetimeString(toString, this.values[1]);
    }

    let from = this.datetimeAdapter.parse(fromString, this.datetimeFormats.parse.datetimeInput);
    let to = this.datetimeAdapter.parse(toString, this.datetimeFormats.parse.datetimeInput);
    this.lastValueValid =
      (!from || this.datetimeAdapter.isValid(from)) && (!to || this.datetimeAdapter.isValid(to));
    from = this.getValidDate(from);
    to = this.getValidDate(to);

    // if the newValue is the same as the oldValue, we intend to not fire the valueChange event
    if (
      !this.datetimeAdapter.sameDate(from, this._values[0]) ||
      !this.datetimeAdapter.sameDate(to, this._values[1]) ||
      (from === null && to === null)
    ) {
      this._values = [from, to];
      this.valueChange.emit(this._values);
      this.onModelChange(this._values);
      this.datetimeInput.emit({
        source: this,
        value: this._values,
        input: this.elmRef.nativeElement
      });
    }
  }
}
