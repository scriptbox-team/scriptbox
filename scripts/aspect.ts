export default class Aspect<T extends (string | number | boolean | symbol)> {
    private _baseValue: T;
    private _modifiers: {[n: number]: (v: T) => T};
    private _permanentModifiers: {[n: number]: (v: T) => T};
    private _modifierIndex: number;
    private _modifierStartIndex: number;

    constructor(initialValue: T, ...permanentModifiers: Array<(v: T) => T>) {
        this._baseValue = initialValue;
        this._modifiers = {};
        this._permanentModifiers = {};
        this._modifierIndex = 0;
        for (const modifier of permanentModifiers) {
            this._permanentModifiers["" + this._modifierIndex] = modifier;
        }
        this._modifierStartIndex = this._modifierIndex;
    }

    public getValue(): T {
        return this._calcValue();
    }

    public get base() {
        return this._baseValue;
    }

    public set base(v) {
        this._baseValue = v;
    }

    public apply(func: (v: T) => T): number {
        this._modifiers["" + this._modifierIndex] = func;
        return this._modifierIndex++;
    }

    public hasModifier(index: number) {
        return this._modifiers[index] !== undefined;
    }

    public remove(index: number) {
        this._modifiers["" + index] = undefined;
    }

    public reset() {
        this._modifiers = this._permanentModifiers;
        this._modifierIndex = this._modifierStartIndex;
    }

    public hardReset() {
        this._modifiers = {};
        this._permanentModifiers = {};
        this._modifierIndex = 0;
        this._modifierStartIndex = 0;
    }

    private _calcValue() {
        // Doing some caching here later might be a good idea
        // But for now it is probably best left as-is
        let val = this._baseValue;
        for (const func of Object.values(this._modifiers)) {
            val = func(val);
        }
        return val;
    }
    public get displayData() {
        return {baseValue: this._baseValue, currentValue: this.getValue()};
    }
}
