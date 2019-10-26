import AspectModifier from "./aspect-modifier";
import AspectSetModifier from "./aspect-set-modifier";

export default class AspectSet<T extends (string | number | boolean | symbol)> {
    public tags: Set<string>;
    private _baseValue: Set<T>;
    private _modifiers: Map<number, AspectSetModifier<T>>;
    private _permanentModifiers: Map<number, AspectSetModifier<T>>;
    private _modifierIndex: number;

    constructor(initialValue: Iterable<T>, tags: string[] = [], ...permanentModifiers: Array<(v: Set<T>) => Set<T>>) {
        this._baseValue = new Set(initialValue);
        this._modifiers = new Map<number, AspectSetModifier<T>>();
        this._permanentModifiers = new Map<number, AspectSetModifier<T>>();
        this._modifierIndex = 0;
        this.tags = new Set(tags);
        for (const modifier of permanentModifiers) {
            this._permanentModifiers.set(this._modifierIndex++, new AspectSetModifier(modifier));
        }
    }

    public getValue(): Set<T> {
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

    public addModifier(func: (v: Set<T>) => Set<T>) {
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

    private _makeModifier(func?: (v: Set<T>) => Set<T>) {
        const modifier = new AspectSetModifier<T>(func);
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
                val = modifier.apply(new Set(val));
            }
        }
        return new Set(val);
    }
}
