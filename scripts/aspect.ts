import AspectModifier from "aspect-modifier";
import Map from "map";
import Set from "set";

export default class Aspect<T extends (string | number | boolean | symbol)> {
    public tags: Set<string>;
    private _baseValue: T;
    private _modifiers: Map<number, AspectModifier<T>>;
    private _permanentModifiers: Map<number, AspectModifier<T>>;
    private _modifierIndex: number;

    constructor(initialValue: T, tags: string[] = [], ...permanentModifiers: Array<(v: T) => T>) {
        this._baseValue = initialValue;
        this._modifiers = new Map<number, AspectModifier<T>>();
        this._permanentModifiers = new Map<number, AspectModifier<T>>();
        this._modifierIndex = 0;
        this.tags = new Set(tags);
        for (const modifier of permanentModifiers) {
            this._permanentModifiers.set(this._modifierIndex++, new AspectModifier(modifier));
        }
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

    public getModifier() {
        return this._makeModifier();
    }

    public addModifier(func: (v: T) => T) {
        return this._makeModifier(func);
    }

    public getFromIndex(index: number) {
        return this._modifiers.get(index);
    }

    public removeFromIndex(index: number) {
        this._modifiers.delete(index);
    }

    public reset() {
        this._modifiers = this._permanentModifiers;
    }

    public get displayData() {
        return {baseValue: this._baseValue, currentValue: this.getValue()};
    }

    private _makeModifier(func?: (v: T) => T) {
        const modifier = new AspectModifier<T>(func);
        this._modifiers.set(this._modifierIndex++, modifier);
        return modifier;
    }

    private _calcValue() {
        let val = this._baseValue;
        const iterator = this._modifiers.entries();
        for (const [id, modifier] of iterator) {
            if (modifier.deleted) {
                this._modifiers.delete(id);
            }
            else {
                val = modifier.apply(val);
            }
        }
        return val;
    }
}
