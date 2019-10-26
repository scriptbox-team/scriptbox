interface SubEventOptions {
    start?: (time: number) => number;
    update?: (time: number) => number;
    end?: (time: number) => number;
}

export default class SubEvent {
    private _update: (time: number) => number;
    private _start: (time: number) => number;
    private _end: (time: number) => number;
    private _next?: SubEvent;
    constructor(options: SubEventOptions) {
        for (const option of ["start", "update", "end"]) {
            if (options[option] !== undefined) {
                (this as any)["_" + option] = options[option];
            }
        }
    }
    public start(delta: number) {
        return this._nextEventIfNegative(this._start(delta));
    }
    public proceed(delta: number) {
        return this._nextEventIfNegative(this._update(delta));
    }
    public wait(time: number) {
        let runTime = time;
        return this.setNext(new SubEvent({update: (delta) => {
            runTime -= delta;
            return runTime;
        }}));
    }
    public do(func: () => void) {
        return this.setNext(new SubEvent({start: (time) => {
            func();
            return -time;
        }}));
    }
    public repeat(repeat: (delta: number) => boolean) {
        return this.setNext(new SubEvent({update: (delta) => {
            return !repeat(delta) ? 0 : 1;
        }}));
    }
    public hold() {
        return this.setNext(new SubEvent({update: (delta) => {
            return this._next !== undefined ? 0 : 1;
        }}));
    }
    public holdRepeat(repeat: (delta: number) => boolean) {
        return this.setNext(new SubEvent({update: (delta) => {
            return !repeat(delta) || this._next !== undefined ? 0 : 1;
        }}));
    }
    public setNext(event: SubEvent) {
        return this._next = event;
    }
    private _nextEventIfNegative(result: number) {
        const ceilPrecision = 100000;
        const ceilResult = this._ceilTo(result, ceilPrecision);
        if (ceilResult <= 0) {
            const modifiedResult = this._end(result);
            if (this._next === undefined) {
                return undefined;
            }
            const ceilModifiedResult = this._ceilTo(modifiedResult, ceilPrecision);
            const nextSubEvent = this._next.start(modifiedResult);
            if (nextSubEvent === this._next && ceilModifiedResult < 0) {
                this._next.proceed(-modifiedResult);
            }
            return nextSubEvent;
        }
        return this;
    }
    private _ceilTo(value: number, precision: number) {
        return Math.ceil(value * precision) / precision;
    }
}
