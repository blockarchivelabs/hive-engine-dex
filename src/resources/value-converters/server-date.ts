import { valueConverter } from 'aurelia-binding';

@valueConverter('serverDate')
export class ServerDate {
    toView(val) {
        if (isNaN(parseInt(val))) {
            return val;
        }

        return `${new Date(val * 1000).toUTCString()}`;
    }
}
