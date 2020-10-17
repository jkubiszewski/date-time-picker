import {
  AfterContentInit,
  AfterViewChecked,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Inject,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
  Optional,
  Output
} from '@angular/core';
import { DatetimePickerIntl } from './datetime-picker-intl.service';
import { DatetimeAdapter } from './adapter/datetime-adapter.class';
import { DATETIME_FORMATS, DatetimeFormats } from './adapter/datetime-format.class';
import { SelectMode } from './datetime-picker.class';
import { take } from 'rxjs/operators';
import { Subscription } from 'rxjs';

@Component({
  selector: 'ng-calendar',
  exportAs: 'ngCalendar',
  templateUrl: './calendar.component.html',
  // tslint:disable-next-line:no-host-metadata-property
  host: {
    class: 'dtp-calendar'
  },
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CalendarComponent<T> implements OnInit, AfterContentInit, AfterViewChecked, OnDestroy {
  /**
   * Date filter for the month and year view
   */
  @Input()
  dateFilter: Function;

  /**
   * Set the first day of week
   */
  @Input()
  firstDayOfWeek: number;

  /** The minimum selectable date. */
  private _minDate: T | null;
  @Input()
  get minDate(): T | null {
    return this._minDate;
  }

  set minDate(value: T | null) {
    value = this.datetimeAdapter.deserialize(value);
    value = this.getValidDate(value);

    this._minDate = value
      ? this.datetimeAdapter.createDate(
          this.datetimeAdapter.getYear(value),
          this.datetimeAdapter.getMonth(value),
          this.datetimeAdapter.getDate(value)
        )
      : null;
  }

  /** The maximum selectable date. */
  private _maxDate: T | null;
  @Input()
  get maxDate(): T | null {
    return this._maxDate;
  }

  set maxDate(value: T | null) {
    value = this.datetimeAdapter.deserialize(value);
    value = this.getValidDate(value);

    this._maxDate = value
      ? this.datetimeAdapter.createDate(
          this.datetimeAdapter.getYear(value),
          this.datetimeAdapter.getMonth(value),
          this.datetimeAdapter.getDate(value)
        )
      : null;
  }

  /** The current picker moment */
  private _pickerMoment: T;
  @Input()
  get pickerMoment(): T {
    return this._pickerMoment;
  }

  set pickerMoment(value: T) {
    value = this.datetimeAdapter.deserialize(value);
    this._pickerMoment = this.getValidDate(value) || this.datetimeAdapter.now();
  }

  @Input()
  selectMode: SelectMode;

  /** The currently selected moment. */
  private _selected: T | null;
  @Input()
  get selected(): T | null {
    return this._selected;
  }

  set selected(value: T | null) {
    value = this.datetimeAdapter.deserialize(value);
    this._selected = this.getValidDate(value);
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
  }

  /**
   * The view that the calendar should start in.
   */
  @Input()
  startView: 'month' | 'year' | 'multi-years' = 'month';

  /**
   * Whether to hide dates in other months at the start or end of the current month.
   */
  @Input()
  hideOtherMonths: boolean;

  /** Emits when the currently picker moment changes. */
  @Output()
  pickerMomentChange = new EventEmitter<T>();

  /** Emits when the currently selected date changes. */
  @Output()
  selectedChange = new EventEmitter<T>();

  /** Emits when any date is selected. */
  @Output()
  userSelection = new EventEmitter<void>();

  /**
   * Emits the selected year. This doesn't imply a change on the selected date
   */
  @Output()
  readonly yearSelected = new EventEmitter<T>();

  /**
   * Emits the selected month. This doesn't imply a change on the selected date
   */
  @Output()
  readonly monthSelected = new EventEmitter<T>();

  get periodButtonText(): string {
    return this.isMonthView
      ? this.datetimeAdapter.format(this.pickerMoment, this.datetimeFormats.display.monthYearLabel)
      : this.datetimeAdapter.getYearName(this.pickerMoment);
  }

  get periodButtonLabel(): string {
    return this.isMonthView
      ? this.pickerIntl.switchToMultiYearViewLabel
      : this.pickerIntl.switchToMonthViewLabel;
  }

  get prevButtonLabel(): string {
    if (this._currentView === 'month') {
      return this.pickerIntl.prevMonthLabel;
    } else if (this._currentView === 'year') {
      return this.pickerIntl.prevYearLabel;
    } else {
      return null;
    }
  }

  get nextButtonLabel(): string {
    if (this._currentView === 'month') {
      return this.pickerIntl.nextMonthLabel;
    } else if (this._currentView === 'year') {
      return this.pickerIntl.nextYearLabel;
    } else {
      return null;
    }
  }

  private _currentView: 'month' | 'year' | 'multi-years';
  get currentView(): 'month' | 'year' | 'multi-years' {
    return this._currentView;
  }

  set currentView(view: 'month' | 'year' | 'multi-years') {
    this._currentView = view;
    this.moveFocusOnNextTick = true;
  }

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

  get showControlArrows(): boolean {
    return this._currentView !== 'multi-years';
  }

  get isMonthView() {
    return this._currentView === 'month';
  }

  /**
   * Date filter for the month and year view
   */
  public dateFilterForViews = (date: T) => {
    return (
      !!date &&
      (!this.dateFilter || this.dateFilter(date)) &&
      (!this.minDate || this.datetimeAdapter.compareDate(date, this.minDate) >= 0) &&
      (!this.maxDate || this.datetimeAdapter.compareDate(date, this.maxDate) <= 0)
    );
  };

  private intlChangesSub = Subscription.EMPTY;

  /**
   * Used for scheduling that focus should be moved to the active cell on the next tick.
   * We need to schedule it, rather than do it immediately, because we have to wait
   * for Angular to re-evaluate the view children.
   */
  private moveFocusOnNextTick = false;

  constructor(
    private elmRef: ElementRef,
    private pickerIntl: DatetimePickerIntl,
    private ngZone: NgZone,
    private cdRef: ChangeDetectorRef,
    @Optional() private datetimeAdapter: DatetimeAdapter<T>,
    @Optional()
    @Inject(DATETIME_FORMATS)
    private datetimeFormats: DatetimeFormats
  ) {
    this.intlChangesSub = this.pickerIntl.changes.subscribe(() => {
      this.cdRef.markForCheck();
    });
  }

  public ngOnInit() {}

  public ngAfterContentInit(): void {
    this._currentView = this.startView;
  }

  public ngAfterViewChecked() {
    if (this.moveFocusOnNextTick) {
      this.moveFocusOnNextTick = false;
      this.focusActiveCell();
    }
  }

  public ngOnDestroy(): void {
    this.intlChangesSub.unsubscribe();
  }

  /**
   * Toggle between month view and year view
   */
  public toggleViews(): void {
    this.currentView = this._currentView === 'month' ? 'multi-years' : 'month';
  }

  /**
   * Handles user clicks on the previous button.
   */
  public previousClicked(): void {
    this.pickerMoment = this.isMonthView
      ? this.datetimeAdapter.addCalendarMonths(this.pickerMoment, -1)
      : this.datetimeAdapter.addCalendarYears(this.pickerMoment, -1);

    this.pickerMomentChange.emit(this.pickerMoment);
  }

  /**
   * Handles user clicks on the next button.
   */
  public nextClicked(): void {
    this.pickerMoment = this.isMonthView
      ? this.datetimeAdapter.addCalendarMonths(this.pickerMoment, 1)
      : this.datetimeAdapter.addCalendarYears(this.pickerMoment, 1);

    this.pickerMomentChange.emit(this.pickerMoment);
  }

  public dateSelected(date: T): void {
    if (!this.dateFilterForViews(date)) {
      return;
    }

    this.selectedChange.emit(date);
  }

  /**
   * Change the pickerMoment value and switch to a specific view
   */
  public goToDateInView(date: T, view: 'month' | 'year' | 'multi-years'): void {
    this.handlePickerMomentChange(date);
    this.currentView = view;
    return;
  }

  /**
   * Change the pickerMoment value
   */
  public handlePickerMomentChange(date: T): void {
    this.pickerMoment = this.datetimeAdapter.clampDate(date, this.minDate, this.maxDate);
    this.pickerMomentChange.emit(this.pickerMoment);
    return;
  }

  public userSelected(): void {
    this.userSelection.emit();
  }

  /**
   * Whether the previous period button is enabled.
   */
  public prevButtonEnabled(): boolean {
    return !this.minDate || !this.isSameView(this.pickerMoment, this.minDate);
  }

  /**
   * Whether the next period button is enabled.
   */
  public nextButtonEnabled(): boolean {
    return !this.maxDate || !this.isSameView(this.pickerMoment, this.maxDate);
  }

  /**
   * Focus to the host element
   */
  public focusActiveCell() {
    this.ngZone.runOutsideAngular(() => {
      this.ngZone.onStable
        .asObservable()
        .pipe(take(1))
        .subscribe(() => {
          this.elmRef.nativeElement.querySelector('.dtp-calendar-cell-active').focus();
        });
    });
  }

  public selectYearInMultiYearView(normalizedYear: T): void {
    this.yearSelected.emit(normalizedYear);
  }

  public selectMonthInYearView(normalizedMonth: T): void {
    this.monthSelected.emit(normalizedMonth);
  }

  /**
   * Whether the two dates represent the same view in the current view mode (month or year).
   */
  private isSameView(date1: T, date2: T): boolean {
    if (this._currentView === 'month') {
      return !!(
        date1 &&
        date2 &&
        this.datetimeAdapter.getYear(date1) === this.datetimeAdapter.getYear(date2) &&
        this.datetimeAdapter.getMonth(date1) === this.datetimeAdapter.getMonth(date2)
      );
    } else if (this._currentView === 'year') {
      return !!(
        date1 &&
        date2 &&
        this.datetimeAdapter.getYear(date1) === this.datetimeAdapter.getYear(date2)
      );
    } else {
      return false;
    }
  }

  /**
   * Get a valid date object
   */
  private getValidDate(obj: any): T | null {
    return this.datetimeAdapter.isDateInstance(obj) && this.datetimeAdapter.isValid(obj)
      ? obj
      : null;
  }
}
