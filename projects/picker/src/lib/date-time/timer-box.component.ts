/**
 * timer-box.component
 */

import {
    ChangeDetectionStrategy,
    Component,
    ElementRef,
    EventEmitter,
    Input,
    OnDestroy,
    OnInit,
    Output,
    ViewChild
} from '@angular/core';
import { coerceNumberProperty } from '@angular/cdk/coercion';
import { Subject, Subscription } from 'rxjs';
import { NumberFixedLenPipe } from './numberedFixLen.pipe';

@Component({
    exportAs: 'owlDateTimeTimerBox',
    selector: 'owl-date-time-timer-box',
    templateUrl: './timer-box.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        '[class.owl-dt-timer-box]': 'owlDTTimerBoxClass'
    },
    providers:[NumberFixedLenPipe]
})
export class OwlTimerBoxComponent implements OnInit, OnDestroy {
    @ViewChild('valueInput', { static: true })
    private _inputValueElement: ElementRef<HTMLInputElement>;

    @Input() showDivider = false;

    @Input() upBtnAriaLabel: string;

    @Input() upBtnDisabled: boolean;

    @Input() downBtnAriaLabel: string;

    @Input() downBtnDisabled: boolean;

    /**
     * Value would be displayed in the box
     * If it is null, the box would display [value]
     */
    @Input() boxValue: number;

    @Input() value: number;

    @Input() min: number;

    @Input() max: number;

    @Input() step = 1;

    @Input() inputLabel: string;

    @Output() valueChange = new EventEmitter<number>();

    @Output() inputChange = new EventEmitter<number>();

    private inputStream = new Subject<string>();

    private inputStreamSub = Subscription.EMPTY;

    private stringValue: string = '';

    private printMode: boolean = false;

    constructor(private readonly numberFixedLen: NumberFixedLenPipe) {}

    get displayValue(): string {
        if (this.printMode) return this.stringValue;
        return '' + this.numberFixedLen.transform(this.boxValue || this.value, 2);
    }

    get owlDTTimerBoxClass(): boolean {
        return true;
    }

    public ngOnInit() {
        this.inputStreamSub = this.inputStream
            .subscribe((val: string) => {
                if (val) {
                    const inputValue = coerceNumberProperty(val, 0);
                    this.updateValueViaInput(inputValue);
                }
            });
    }

    public ngOnDestroy(): void {
        this.inputStreamSub.unsubscribe();
    }

    public upBtnClicked(): void {
        this.updateValue(this.value + this.step);
    }

    public downBtnClicked(): void {
        this.updateValue(this.value - this.step);
    }

    public handleInputChange(value: string): void {
        this.inputStream.next(value);
    }

    public handleWheelChange(event: WheelEvent) {
        const deltaY = event.deltaY;
        if (deltaY > 0 && !this.upBtnDisabled) {
            this.upBtnClicked();
        } else if (deltaY < 0 && !this.downBtnDisabled) {
            this.downBtnClicked();
        }
    }

    private updateValue(value: number): void {
        this._inputValueElement.nativeElement.focus();
        this.stringValue = '' + this.numberFixedLen.transform(this.validateValue(value), 2);
        this.valueChange.emit(value);
    }

    private updateValueViaInput(value: number): void {
        if (value > this.max || value < this.min) {
            return;
        }
        this.inputChange.emit(value);
    }

    onFocus(){
        this.printMode = true;
        this.stringValue = '' + this.numberFixedLen.transform(this.boxValue || this.value, 2);
    }

    onBlur(){
        this.printMode = false;
    }

    private  validateValue(value:number): number {
        return value > this.max ? this.min : value < this.min ? this.max : value;
    }
}
