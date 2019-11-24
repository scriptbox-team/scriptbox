interface SubEventOptions {
    start?: (time: number) => number;
    update?: (time: number) => number;
    end?: (time: number) => number;
}

export default class SubEvent {
    private _update?: (time: number) => number;
    private _start?: () => void;
    private _end?: () => void;
    private _next?: SubEvent;
    constructor(options?: SubEventOptions) {
        if (options !== undefined) {
            for (const option of ["start", "update", "end"]) {
                if ((options as any)[option] !== undefined) {
                    (this as any)["_" + option] = (options as any)[option];
                }
            }
        }
    }
    public start() {
        if (this._start !== undefined) {
            this._start();
        }
    }
    public proceed(delta: number): SubEvent | undefined {
        const res = this._update !== undefined ? this._update(delta) : 0;
        return this._nextEventIfNegative(res);
    }
    public wait(time: number) {
        let runTime = time;
        return this.setNext(new SubEvent({update: (delta) => {
            const result = runTime -= delta;
            if (runTime < 0) {
                runTime = time;
            }
            return result;
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
    private _nextEventIfNegative(result: number): SubEvent | undefined {
        const ceilPrecision = 100000;
        const ceilResult = this._ceilTo(result, ceilPrecision);
        if (ceilResult <= 0) {
            if (this._end !== undefined) {
                this._end();
            }
            if (this._next === undefined) {
                return undefined;
            }
            this._next.start();
            if (ceilResult < 0) {
                return this._next.proceed(-ceilResult);
            }
            return this._next;
        }
        return this;
    }
    private _ceilTo(value: number, precision: number) {
        return Math.ceil(value * precision) / precision;
    }
}
