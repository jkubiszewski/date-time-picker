/**
 * hour-input.component
 */

import {
    ChangeDetectionStrategy,
    Component,
    EventEmitter,
    forwardRef,
    Input,
    Output
} from '@angular/core';
import { OwlDateTimeIntl } from './date-time-picker-intl.service';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
    exportAs: 'owlHourInput',
    selector: 'owl-hour-input',
    templateUrl: './hour-input.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        '[class.owl-hour-input]': 'owlHourInputClass'
    },
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => OwlHourInputComponent),
            multi: true
        }
    ]
})
export class OwlHourInputComponent implements ControlValueAccessor {
    @Input() upBtnAriaLabel: string;
    @Input() upBtnDisabled: boolean;
    @Input() downBtnAriaLabel: string;
    @Input() downBtnDisabled: boolean;
    private _value: number;
    get value(): number {
        return this._value;
    }
    @Input() set value(value: number) {
        this._value = value;
        this.onChange(value);
        this.onTouch(value);
    }
    @Input() min = 0;
    @Input() max = 23;
    @Input() step = 1;
    @Input() hour12Timer: boolean;
    @Output() valueChange = new EventEmitter<number>();

    private isPM = false;

    constructor(private pickerIntl: OwlDateTimeIntl) {}

    get hour12ButtonLabel(): string {
        return this.isPM
            ? this.pickerIntl.hour12PMLabel
            : this.pickerIntl.hour12AMLabel;
    }

    get owlHourInputClass(): boolean {
        return true;
    }

    get hourValue(): number {
        return this.value;
    }

    get boxValue(): number {
        let hours = this.hourValue;

        if (!this.hour12Timer) {
            return hours;
        } else {
            if (hours === 0) {
                hours = 12;
                this.isPM = false;
            } else if (hours > 0 && hours < 12) {
                this.isPM = false;
            } else if (hours === 12) {
                this.isPM = true;
            } else if (hours > 12 && hours < 24) {
                hours = hours - 12;
                this.isPM = true;
            }
            return hours;
        }
    }

    public upBtnClicked(): void {
        this.valueChanged(this.value + this.step);
    }

    public downBtnClicked(): void {
        this.valueChanged(this.value - this.step);
    }

    public setValueViaInput(hours: number): void {
        if (this.value && this.isPM && hours >= 1 && hours <= 11) {
            hours = hours + 12;
        } else if (this.value && !this.isPM && hours === 12) {
            hours = 0;
        }

        this.value = hours;
        this.valueChanged(this.value);
    }

    public setValue(hours: number): void {
        if (hours < this.min) {
            this.value = this.max;
        } else if (hours > this.max) {
            this.value = this.min;
        } else {
            this.value = hours;
        }
        this.valueChanged(this.value);
    }

    public setMeridian(): void {
        this.isPM = !this.isPM;
        let hours = this.hourValue;

        if (this.isPM) {
            hours = hours + 12;
        } else {
            hours = hours - 12;
        }

        if (hours >= 0 && hours <= 23) {
            this.setValue(hours);
        }
        this.valueChanged(this.value);
    }

    private valueChanged(value: number): void {
        this.valueChange.emit(value);
    }

    onChange: any = () => {};

    onTouch: any = () => {};

    writeValue(value: any) {
        this.value = value;
    }
    registerOnChange(fn: any) {
        this.onChange = fn;
    }

    registerOnTouched(fn: any) {
        this.onTouch = fn;
    }
}
