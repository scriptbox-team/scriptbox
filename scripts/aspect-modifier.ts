export default class AspectModifier<T extends (string | number | boolean | symbol)> {
    private _func?: (v: T) => T;
    private _deleted: boolean;
    constructor(func?: (v: T) => T) {
        this._func = func;
        this._deleted = false;
    }
    public delete() {
        this._deleted = true;
    }
    public set(func: (v: T) => T) {
        this._func = func;
    }
    public apply(value: T) {
        if (this._func !== undefined) {
            return this._func(value);
        }
        return value;
    }
    get deleted() {
        return this._deleted;
    }
}
