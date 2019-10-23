import { PlayerProxy } from "./player";

export interface MetaInfoProxy {
    name: string;
    description: string;
    owner?: PlayerProxy;
    enabled: boolean;
    readonly exists: boolean;
}

export default class MetaInfo {
    public name: string;
    public description: string;
    public owner?: PlayerProxy;
    public exists: boolean;
    private _enabled: boolean;
    private _tags: Set<string>;
    private _forceDisabled: boolean;
    constructor(
            name: string,
            description: string,
            enabled: boolean,
            exists: boolean,
            tags: string[],
            owner?: PlayerProxy) {
        this.name = name;
        this.description = description;
        this.owner = owner;
        this._enabled = enabled;
        this.exists = exists;
        this._tags = new Set<string>(tags);
        this._forceDisabled = false;
    }
    public addTag(tag: string) {
        this._tags.add(tag);
    }
    public removeTag(tag: string) {
        this._tags.delete(tag);
    }
    public hasTag(tag: string) {
        return this._tags.has(tag);
    }
    public getTags() {
        return Array.from(this._tags.values());
    }
    public forceDisable() {
        this._forceDisabled = true;
        this._enabled = false;
    }
    public manualEnable() {
        this._forceDisabled = false;
        this._enabled = true;
    }
    get enabled() {
        return this._enabled;
    }
    set enabled(value: boolean) {
        if (!this._forceDisabled || this._enabled) {
            this._enabled = value;
        }
    }
}
