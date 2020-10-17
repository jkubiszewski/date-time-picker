import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'leftPad'
})
export class LeftPadPipe implements PipeTransform {
  transform(value: number, length = 2): string | number {
    if (value === null || isNaN(value) || isNaN(length)) {
      return value;
    }

    let numString = value.toString();

    while (numString.length < length) {
      numString = '0' + numString;
    }

    return numString;
  }
}
