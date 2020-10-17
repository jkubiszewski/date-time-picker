import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  NgZone,
  OnInit,
  Output
} from '@angular/core';
import { SelectMode } from './datetime-picker.class';
import { take } from 'rxjs/operators';

export class CalendarCell {
  constructor(
    public value: number,
    public displayValue: string,
    public ariaLabel: string,
    public enabled: boolean,
    public out: boolean = false,
    public cellClass: string = ''
  ) {}
}

@Component({
  selector: '[ng-calendar-body]',
  exportAs: 'ngCalendarBody',
  templateUrl: './calendar-body.component.html',
  // tslint:disable-next-line:no-host-metadata-property
  host: {
    class: 'dtp-calendar-body',
    role: 'grid',
    'aria-readonly': 'true'
  },
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CalendarBodyComponent implements OnInit {
  /**
   * The cell number of the active cell in the table.
   */
  @Input()
  activeCell = 0;

  /**
   * The cells to display in the table.
   */
  @Input()
  rows: CalendarCell[][];

  /**
   * The number of columns in the table.
   */
  @Input()
  numCols = 7;

  /**
   * The ratio (width / height) to use for the cells in the table.
   */
  @Input()
  cellRatio = 1;

  /**
   * The value in the table that corresponds to today.
   */
  @Input()
  todayValue: number;

  /**
   * The value in the table that is currently selected.
   */
  @Input()
  selectedValues: number[];

  /**
   * Current picker select mode
   */
  @Input()
  selectMode: SelectMode;

  /**
   * Emit when a calendar cell is selected
   */
  @Output()
  public readonly select = new EventEmitter<CalendarCell>();

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

  constructor(private elmRef: ElementRef, private ngZone: NgZone) {}

  public ngOnInit() {}

  public selectCell(cell: CalendarCell): void {
    this.select.emit(cell);
  }

  public isActiveCell(rowIndex: number, colIndex: number): boolean {
    const cellNumber = rowIndex * this.numCols + colIndex;
    return cellNumber === this.activeCell;
  }

  /**
   * Check if the cell is selected
   */
  public isSelected(value: number): boolean {
    if (!this.selectedValues || this.selectedValues.length === 0) {
      return false;
    }

    if (this.isInSingleMode) {
      return value === this.selectedValues[0];
    }

    if (this.isInRangeMode) {
      const fromValue = this.selectedValues[0];
      const toValue = this.selectedValues[1];

      return value === fromValue || value === toValue;
    }
  }

  /**
   * Check if the cell in the range
   */
  public isInRange(value: number): boolean {
    if (this.isInRangeMode) {
      const fromValue = this.selectedValues[0];
      const toValue = this.selectedValues[1];

      if (fromValue !== null && toValue !== null) {
        return value >= fromValue && value <= toValue;
      } else {
        return value === fromValue || value === toValue;
      }
    }
  }

  /**
   * Check if the cell is the range from
   */
  public isRangeFrom(value: number): boolean {
    if (this.isInRangeMode) {
      const fromValue = this.selectedValues[0];
      return fromValue !== null && value === fromValue;
    }
  }

  /**
   * Check if the cell is the range to
   */
  public isRangeTo(value: number): boolean {
    if (this.isInRangeMode) {
      const toValue = this.selectedValues[1];
      return toValue !== null && value === toValue;
    }
  }

  /**
   * Focus to a active cell
   */
  public focusActiveCell(): void {
    this.ngZone.runOutsideAngular(() => {
      this.ngZone.onStable
        .asObservable()
        .pipe(take(1))
        .subscribe(() => {
          this.elmRef.nativeElement.querySelector('.dtp-calendar-cell-active').focus();
        });
    });
  }
}
