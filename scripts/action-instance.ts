import Aspect from "aspect";
import Component from "component";
import SubEvent from "sub-event";

export default class ActionInstance extends Component {
    public loopAtEnd: Aspect<boolean> = new Aspect<boolean>(false);
    public finished: boolean = false;
    private _startSubEvent?: SubEvent;
    private _subEvent?: SubEvent;
    private _endSubEvent?: SubEvent;
    private _always: Array<() => void> = [];
    public onCreate() {
        this.loopAtEnd = new Aspect<boolean>(false);
        this._startSubEvent = new SubEvent({});
        this._subEvent = this._startSubEvent;
        this._endSubEvent = this._startSubEvent;
    }
    public onPostUpdate(delta: number) {
        super.onPostUpdate(delta);
        if (this._subEvent !== undefined) {
            this._subEvent = this._subEvent.proceed(delta);
        }
        if (this._subEvent === undefined) {
            if (this.loopAtEnd.getValue()) {
                this._subEvent = this._startSubEvent;
            }
            else {
                this._end();
            }
        }
    }
    public wait(time: number) {
        if (this._endSubEvent) {
            this._endSubEvent = this._endSubEvent.wait(time);
        }
        return this;
    }
    public do(func: () => void) {
        if (this._endSubEvent) {
            this._endSubEvent = this._endSubEvent.do(func);
        }
        return this;
    }
    public repeat(repeat: (delta: number) => boolean) {
        if (this._endSubEvent) {
            this._endSubEvent = this._endSubEvent.repeat(repeat);
        }
        return this;
    }
    public hold() {
        if (this._endSubEvent) {
            this._endSubEvent = this._endSubEvent.hold();
        }
        return this;
    }
    public always(func: () => void) {
        this._always.push(func);
    }
    public holdRepeat(repeat: (delta: number) => boolean) {
        if (this._endSubEvent) {
            this._endSubEvent = this._endSubEvent.holdRepeat(repeat);
        }
        return this;
    }
    public cancel() {
        this._end();
    }
    public loop() {
        this.loopAtEnd.base = true;
    }
    public onUnload() {
        if (this.entity.exists) {
            this.entity.remove(this);
        }
    }
    private _end() {
        for (const func of this._always) {
            func();
        }
        this.finished = true;
        this.destroy();
    }
}
