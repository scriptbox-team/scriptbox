import Component from "./component";
import SubEvent from "./sub-event";

export default class EventComponent extends Component {
    private _subEvent: SubEvent;
    public create() {
    }
    public postUpdate(delta: number) {
        super.postUpdate(delta);
        this._subEvent = this._subEvent.proceed(delta);
        if (this._subEvent === undefined) {
            this.entity.remove(this);
        }
    }
    public wait(time: number) {
        return this._subEvent.wait(time);
    }
    public do(func: () => void) {
        return this._subEvent.do(func);
    }
    public repeat(repeat: (delta: number) => boolean) {
        return this._subEvent.repeat(repeat);
    }
    public hold() {
        return this._subEvent.hold();
    }
    public holdRepeat(repeat: (delta: number) => boolean) {
        return this._subEvent.holdRepeat(repeat);
    }
    public cancel() {
        this._subEvent = undefined;
        this.entity.remove(this);
    }
}
