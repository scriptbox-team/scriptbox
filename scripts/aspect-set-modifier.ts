export default class AspectSetModifier<T extends (string | number | boolean | symbol)> {
    private _func?: (v: Set<T>) => Set<T>;
    private _deleted: boolean;
    constructor(func?: (v: Set<T>) => Set<T>) {
        this._func = func;
        this._deleted = false;
    }
    public delete() {
        this._deleted = true;
    }
    public set(func: (v: Set<T>) => Set<T>) {
        this._func = func;
    }
    public apply(value: Set<T>) {
        if (this._func !== undefined) {
            return this._func(value);
        }
        return value;
    }
    get deleted() {
        return this._deleted;
    }
}
