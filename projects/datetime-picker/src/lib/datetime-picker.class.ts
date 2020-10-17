import { EventEmitter, Inject, Input, Optional, Directive } from '@angular/core';
import { coerceBooleanProperty, coerceNumberProperty } from '@angular/cdk/coercion';
import { DatetimeAdapter } from './adapter/datetime-adapter.class';
import { DATETIME_FORMATS, DatetimeFormats } from './adapter/datetime-format.class';

let nextUniqueId = 0;

export type PickerType = 'both' | 'calendar' | 'timer';

export type PickerMode = 'popup' | 'dialog' | 'inline';

export type SelectMode = 'single' | 'range' | 'rangeFrom' | 'rangeTo';

export type ViewType = 'month' | 'year' | 'multi-years';

@Directive()
export abstract class DatetimePickerDirective<T> {
  /**
   * Whether to show the second's timer
   */
  private _showSecondsTimer = false;
  @Input()
  get showSecondsTimer(): boolean {
    return this._showSecondsTimer;
  }

  set showSecondsTimer(val: boolean) {
    this._showSecondsTimer = coerceBooleanProperty(val);
  }

  /**
   * Whether the timer is in hour12 format
   */
  private _hour12Timer = false;
  @Input()
  get hour12Timer(): boolean {
    return this._hour12Timer;
  }

  set hour12Timer(val: boolean) {
    this._hour12Timer = coerceBooleanProperty(val);
  }

  /**
   * The view that the calendar should start in.
   */
  @Input()
  startView: 'month' | 'year' | 'multi-years' = 'month';

  /**
   * Hours to change per step
   */
  private _stepHour = 1;
  @Input()
  get stepHour(): number {
    return this._stepHour;
  }

  set stepHour(val: number) {
    this._stepHour = coerceNumberProperty(val, 1);
  }

  /**
   * Minutes to change per step
   */
  private _stepMinute = 1;
  @Input()
  get stepMinute(): number {
    return this._stepMinute;
  }

  set stepMinute(val: number) {
    this._stepMinute = coerceNumberProperty(val, 1);
  }

  /**
   * Seconds to change per step
   */
  private _stepSecond = 1;
  @Input()
  get stepSecond(): number {
    return this._stepSecond;
  }

  set stepSecond(val: number) {
    this._stepSecond = coerceNumberProperty(val, 1);
  }

  /**
   * Set the first day of week
   */
  private _firstDayOfWeek: number;
  @Input()
  get firstDayOfWeek() {
    return this._firstDayOfWeek;
  }

  set firstDayOfWeek(value: number) {
    value = coerceNumberProperty(value);
    if (value > 6 || value < 0) {
      this._firstDayOfWeek = undefined;
    } else {
      this._firstDayOfWeek = value;
    }
  }

  /**
   * Whether to hide dates in other months at the start or end of the current month.
   */
  private _hideOtherMonths = false;
  @Input()
  get hideOtherMonths(): boolean {
    return this._hideOtherMonths;
  }

  set hideOtherMonths(val: boolean) {
    this._hideOtherMonths = coerceBooleanProperty(val);
  }

  private readonly _id: string;
  get id(): string {
    return this._id;
  }

  abstract get selected(): T | null;

  abstract get selecteds(): T[] | null;

  abstract get datetimeFilter(): (date: T | null) => boolean;

  abstract get maxDatetime(): T | null;

  abstract get minDatetime(): T | null;

  abstract get selectMode(): SelectMode;

  abstract get startAt(): T | null;

  abstract get opened(): boolean;

  abstract get pickerMode(): PickerMode;

  abstract get pickerType(): PickerType;

  abstract get isInSingleMode(): boolean;

  abstract get isInRangeMode(): boolean;

  abstract select(date: T | T[]): void;

  abstract yearSelected: EventEmitter<T>;

  abstract monthSelected: EventEmitter<T>;

  abstract selectYear(normalizedYear: T): void;

  abstract selectMonth(normalizedMonth: T): void;

  get formatString(): string {
    return this.pickerType === 'both'
      ? this.datetimeFormats.display.fullInput
      : this.pickerType === 'calendar'
      ? this.datetimeFormats.display.dateInput
      : this.datetimeFormats.display.timeInput;
  }

  /**
   * Date Time Checker to check if the give datetime is selectable
   */
  public datetimeChecker = (datetime: T) => {
    return (
      !!datetime &&
      (!this.datetimeFilter || this.datetimeFilter(datetime)) &&
      (!this.minDatetime || this.datetimeAdapter.compareDate(datetime, this.minDatetime) >= 0) &&
      (!this.maxDatetime || this.datetimeAdapter.compareDate(datetime, this.maxDatetime) <= 0)
    );
  };

  get disabled(): boolean {
    return false;
  }

  constructor(
    @Optional() protected datetimeAdapter: DatetimeAdapter<T>,
    @Optional()
    @Inject(DATETIME_FORMATS)
    protected datetimeFormats: DatetimeFormats
  ) {
    if (!this.datetimeAdapter) {
      throw Error(
        `DatetimePicker: No provider found for DatetimeAdapter. You must import one of the following ` +
          `modules at your application root: NativeDatetimeModule, MomentDatetimeModule, or provide a ` +
          `custom implementation.`
      );
    }

    if (!this.datetimeFormats) {
      throw Error(
        `DatetimePicker: No provider found for DATE_TIME_FORMATS. You must import one of the following ` +
          `modules at your application root: NativeDatetimeModule, MomentDatetimeModule, or provide a ` +
          `custom implementation.`
      );
    }

    this._id = `dtp-picker-${nextUniqueId++}`;
  }

  protected getValidDate(obj: any): T | null {
    return this.datetimeAdapter.isDateInstance(obj) && this.datetimeAdapter.isValid(obj)
      ? obj
      : null;
  }
}
