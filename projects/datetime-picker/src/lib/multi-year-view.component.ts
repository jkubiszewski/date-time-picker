import {
  AfterContentInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Optional,
  Output,
  ViewChild
} from '@angular/core';
import { DatetimeAdapter } from './adapter/datetime-adapter.class';
import { CalendarCell, CalendarBodyComponent } from './calendar-body.component';
import { SelectMode } from './datetime-picker.class';
import {
  DOWN_ARROW,
  END,
  ENTER,
  HOME,
  LEFT_ARROW,
  PAGE_DOWN,
  PAGE_UP,
  RIGHT_ARROW,
  UP_ARROW
} from '@angular/cdk/keycodes';
import { DatetimePickerIntl } from './datetime-picker-intl.service';

export const YEARS_PER_ROW = 3;
export const YEAR_ROWS = 7;

@Component({
  selector: 'ng-multi-year-view',
  exportAs: 'ngMultiYearView',
  templateUrl: 'multi-year-view.component.html',
  // tslint:disable-next-line:no-host-metadata-property
  host: {
    '[class.dtp-calendar-view]': 'dtCalendarView',
    '[class.dtp-calendar-multi-year-view]': 'dtCalendarMultiYearView'
  },
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MultiYearViewComponent<T> implements OnInit, AfterContentInit {
  /**
   * The select mode of the picker;
   */
  private _selectMode: SelectMode = 'single';
  @Input()
  get selectMode(): SelectMode {
    return this._selectMode;
  }

  set selectMode(val: SelectMode) {
    this._selectMode = val;
    if (this.initiated) {
      this.setSelectedYears();
      this.cdRef.markForCheck();
    }
  }

  /** The currently selected date. */
  private _selected: T | null;
  @Input()
  get selected(): T | null {
    return this._selected;
  }

  set selected(value: T | null) {
    const oldSelected = this._selected;
    value = this.datetimeAdapter.deserialize(value);
    this._selected = this.getValidDate(value);

    if (!this.datetimeAdapter.sameDate(oldSelected, this._selected)) {
      this.setSelectedYears();
    }
  }

  private _selecteds: T[] = [];
  @Input()
  get selecteds(): T[] {
    return this._selecteds;
  }

  set selecteds(values: T[]) {
    this._selecteds = values.map(v => {
      v = this.datetimeAdapter.deserialize(v);
      return this.getValidDate(v);
    });
    this.setSelectedYears();
  }

  private _pickerMoment: T | null;
  @Input()
  get pickerMoment() {
    return this._pickerMoment;
  }

  set pickerMoment(value: T) {
    const oldMoment = this._pickerMoment;
    value = this.datetimeAdapter.deserialize(value);
    this._pickerMoment = this.getValidDate(value) || this.datetimeAdapter.now();

    if (oldMoment && this._pickerMoment && !this.isSameYearList(oldMoment, this._pickerMoment)) {
      this.generateYearList();
    }
  }

  /**
   * A function used to filter which dates are selectable
   */
  private _dateFilter: (date: T) => boolean;
  @Input()
  get dateFilter() {
    return this._dateFilter;
  }

  set dateFilter(filter: (date: T) => boolean) {
    this._dateFilter = filter;
    if (this.initiated) {
      this.generateYearList();
    }
  }

  /** The minimum selectable date. */
  private _minDate: T | null;
  @Input()
  get minDate(): T | null {
    return this._minDate;
  }

  set minDate(value: T | null) {
    value = this.datetimeAdapter.deserialize(value);
    this._minDate = this.getValidDate(value);
    if (this.initiated) {
      this.generateYearList();
    }
  }

  /** The maximum selectable date. */
  private _maxDate: T | null;
  @Input()
  get maxDate(): T | null {
    return this._maxDate;
  }

  set maxDate(value: T | null) {
    value = this.datetimeAdapter.deserialize(value);
    this._maxDate = this.getValidDate(value);
    if (this.initiated) {
      this.generateYearList();
    }
  }

  private _todayYear: number;
  get todayYear(): number {
    return this._todayYear;
  }

  private _years: CalendarCell[][];
  get years() {
    return this._years;
  }

  private _selectedYears: number[];
  get selectedYears(): number[] {
    return this._selectedYears;
  }

  private initiated = false;

  get isInSingleMode(): boolean {
    return this.selectMode === 'single';
  }

  get isInRangeMode(): boolean {
    return (
      this.selectMode === 'range' ||
      this.selectMode === 'rangeFrom' ||
      this.selectMode === 'rangeTo'
    );
  }

  get activeCell(): number {
    if (this._pickerMoment) {
      return this.datetimeAdapter.getYear(this._pickerMoment) % (YEARS_PER_ROW * YEAR_ROWS);
    }
  }

  get tableHeader(): string {
    if (this._years && this._years.length > 0) {
      return `${this._years[0][0].displayValue} - ${
        this._years[YEAR_ROWS - 1][YEARS_PER_ROW - 1].displayValue
      }`;
    }
  }

  get prevButtonLabel(): string {
    return this.pickerIntl.prevMultiYearLabel;
  }

  get nextButtonLabel(): string {
    return this.pickerIntl.nextMultiYearLabel;
  }

  /**
   * Callback to invoke when a new month is selected
   */
  @Output() readonly change = new EventEmitter<T>();

  /**
   * Emits the selected year. This doesn't imply a change on the selected date
   */
  @Output() readonly yearSelected = new EventEmitter<T>();

  /** Emits when any date is activated. */
  @Output() readonly pickerMomentChange: EventEmitter<T> = new EventEmitter<T>();

  /** Emits when use keyboard enter to select a calendar cell */
  @Output() readonly keyboardEnter: EventEmitter<any> = new EventEmitter<any>();

  /** The body of calendar table */
  @ViewChild(CalendarBodyComponent, { static: true })
  calendarBodyElm: CalendarBodyComponent;

  get dtCalendarView(): boolean {
    return true;
  }

  get dtCalendarMultiYearView(): boolean {
    return true;
  }

  constructor(
    private cdRef: ChangeDetectorRef,
    private pickerIntl: DatetimePickerIntl,
    @Optional() private datetimeAdapter: DatetimeAdapter<T>
  ) {}

  public ngOnInit() {}

  public ngAfterContentInit(): void {
    this._todayYear = this.datetimeAdapter.getYear(this.datetimeAdapter.now());
    this.generateYearList();
    this.initiated = true;
  }

  /**
   * Handle a calendarCell selected
   */
  public selectCalendarCell(cell: CalendarCell): void {
    this.selectYear(cell.value);
  }

  private selectYear(year: number): void {
    this.yearSelected.emit(this.datetimeAdapter.createDate(year, 0, 1));
    const firstDateOfMonth = this.datetimeAdapter.createDate(
      year,
      this.datetimeAdapter.getMonth(this.pickerMoment),
      1
    );
    const daysInMonth = this.datetimeAdapter.getNumDaysInMonth(firstDateOfMonth);
    const selected = this.datetimeAdapter.createDate(
      year,
      this.datetimeAdapter.getMonth(this.pickerMoment),
      Math.min(daysInMonth, this.datetimeAdapter.getDate(this.pickerMoment)),
      this.datetimeAdapter.getHours(this.pickerMoment),
      this.datetimeAdapter.getMinutes(this.pickerMoment),
      this.datetimeAdapter.getSeconds(this.pickerMoment)
    );

    this.change.emit(selected);
  }

  /**
   * Generate the previous year list
   */
  public prevYearList(event: any): void {
    this._pickerMoment = this.datetimeAdapter.addCalendarYears(
      this.pickerMoment,
      -1 * YEAR_ROWS * YEARS_PER_ROW
    );
    this.generateYearList();
    event.preventDefault();
  }

  /**
   * Generate the next year list
   */
  public nextYearList(event: any): void {
    this._pickerMoment = this.datetimeAdapter.addCalendarYears(
      this.pickerMoment,
      YEAR_ROWS * YEARS_PER_ROW
    );
    this.generateYearList();
    event.preventDefault();
  }

  public generateYearList(): void {
    this._years = [];

    const pickerMomentYear = this.datetimeAdapter.getYear(this._pickerMoment);
    const offset = pickerMomentYear % (YEARS_PER_ROW * YEAR_ROWS);

    for (let i = 0; i < YEAR_ROWS; i++) {
      const row = [];

      for (let j = 0; j < YEARS_PER_ROW; j++) {
        const year = pickerMomentYear - offset + (j + i * YEARS_PER_ROW);
        const yearCell = this.createYearCell(year);
        row.push(yearCell);
      }

      this._years.push(row);
    }

    return;
  }

  /** Whether the previous period button is enabled. */
  public previousEnabled(): boolean {
    if (!this.minDate) {
      return true;
    }
    return !this.minDate || !this.isSameYearList(this._pickerMoment, this.minDate);
  }

  /** Whether the next period button is enabled. */
  public nextEnabled(): boolean {
    return !this.maxDate || !this.isSameYearList(this._pickerMoment, this.maxDate);
  }

  public handleCalendarKeydown(event: KeyboardEvent): void {
    let moment;
    switch (event.keyCode) {
      // minus 1 year
      case LEFT_ARROW:
        moment = this.datetimeAdapter.addCalendarYears(this._pickerMoment, -1);
        this.pickerMomentChange.emit(moment);
        break;

      // add 1 year
      case RIGHT_ARROW:
        moment = this.datetimeAdapter.addCalendarYears(this._pickerMoment, 1);
        this.pickerMomentChange.emit(moment);
        break;

      // minus 3 years
      case UP_ARROW:
        moment = this.datetimeAdapter.addCalendarYears(this._pickerMoment, -1 * YEARS_PER_ROW);
        this.pickerMomentChange.emit(moment);
        break;

      // add 3 years
      case DOWN_ARROW:
        moment = this.datetimeAdapter.addCalendarYears(this._pickerMoment, YEARS_PER_ROW);
        this.pickerMomentChange.emit(moment);
        break;

      // go to the first year of the year page
      case HOME:
        moment = this.datetimeAdapter.addCalendarYears(
          this._pickerMoment,
          -this.datetimeAdapter.getYear(this._pickerMoment) % (YEARS_PER_ROW * YEAR_ROWS)
        );
        this.pickerMomentChange.emit(moment);
        break;

      // go to the last year of the year page
      case END:
        moment = this.datetimeAdapter.addCalendarYears(
          this._pickerMoment,
          YEARS_PER_ROW * YEAR_ROWS -
            (this.datetimeAdapter.getYear(this._pickerMoment) % (YEARS_PER_ROW * YEAR_ROWS)) -
            1
        );
        this.pickerMomentChange.emit(moment);
        break;

      // minus 1 year page (or 10 year pages)
      case PAGE_UP:
        moment = this.datetimeAdapter.addCalendarYears(
          this.pickerMoment,
          event.altKey ? -10 * (YEARS_PER_ROW * YEAR_ROWS) : -1 * (YEARS_PER_ROW * YEAR_ROWS)
        );
        this.pickerMomentChange.emit(moment);
        break;

      // add 1 year page (or 10 year pages)
      case PAGE_DOWN:
        moment = this.datetimeAdapter.addCalendarYears(
          this.pickerMoment,
          event.altKey ? 10 * (YEARS_PER_ROW * YEAR_ROWS) : YEARS_PER_ROW * YEAR_ROWS
        );
        this.pickerMomentChange.emit(moment);
        break;

      case ENTER:
        this.selectYear(this.datetimeAdapter.getYear(this._pickerMoment));
        this.keyboardEnter.emit();
        break;

      default:
        return;
    }

    this.focusActiveCell();
    event.preventDefault();
  }

  /**
   * Creates an CalendarCell for the given year.
   */
  private createYearCell(year: number): CalendarCell {
    const startDateOfYear = this.datetimeAdapter.createDate(year, 0, 1);
    const ariaLabel = this.datetimeAdapter.getYearName(startDateOfYear);
    const cellClass = 'dtp-year-' + year;
    return new CalendarCell(
      year,
      year.toString(),
      ariaLabel,
      this.isYearEnabled(year),
      false,
      cellClass
    );
  }

  private setSelectedYears(): void {
    this._selectedYears = [];

    if (this.isInSingleMode && this.selected) {
      this._selectedYears[0] = this.datetimeAdapter.getYear(this.selected);
    }

    if (this.isInRangeMode && this.selecteds) {
      this._selectedYears = this.selecteds.map(selected => {
        if (this.datetimeAdapter.isValid(selected)) {
          return this.datetimeAdapter.getYear(selected);
        } else {
          return null;
        }
      });
    }
  }

  /** Whether the given year is enabled. */
  private isYearEnabled(year: number) {
    // disable if the year is greater than maxDate lower than minDate
    if (
      year === undefined ||
      year === null ||
      (this.maxDate && year > this.datetimeAdapter.getYear(this.maxDate)) ||
      (this.minDate && year < this.datetimeAdapter.getYear(this.minDate))
    ) {
      return false;
    }

    // enable if it reaches here and there's no filter defined
    if (!this.dateFilter) {
      return true;
    }

    const firstOfYear = this.datetimeAdapter.createDate(year, 0, 1);

    // If any date in the year is enabled count the year as enabled.
    for (
      let date = firstOfYear;
      this.datetimeAdapter.getYear(date) === year;
      date = this.datetimeAdapter.addCalendarDays(date, 1)
    ) {
      if (this.dateFilter(date)) {
        return true;
      }
    }

    return false;
  }

  private isSameYearList(date1: T, date2: T): boolean {
    return (
      Math.floor(this.datetimeAdapter.getYear(date1) / (YEARS_PER_ROW * YEAR_ROWS)) ===
      Math.floor(this.datetimeAdapter.getYear(date2) / (YEARS_PER_ROW * YEAR_ROWS))
    );
  }

  /**
   * Get a valid date object
   */
  private getValidDate(obj: any): T | null {
    return this.datetimeAdapter.isDateInstance(obj) && this.datetimeAdapter.isValid(obj)
      ? obj
      : null;
  }

  private focusActiveCell() {
    this.calendarBodyElm.focusActiveCell();
  }
}
