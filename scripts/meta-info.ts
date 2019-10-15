import Player from "./player";

export interface IMetaInfoProxy {
    name: string;
    description: string;
    owner?: Player;
    enabled: boolean;
    readonly exists: boolean;
}

export default class MetaInfo {
    public name: string;
    public description: string;
    public owner?: Player;
    public forceDisabled: boolean;
    public exists: boolean;
    private _enabled: boolean;
    private _tags: Set<string>;
    constructor(name: string, description: string, enabled: boolean, exists: boolean, tags: string[], owner?: Player) {
        this.name = name;
        this.description = description;
        this.owner = owner;
        this._enabled = enabled;
        this.exists = exists;
        this._tags = new Set<string>(tags);
        this.forceDisabled = false;
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
    get enabled() {
        return this._enabled;
    }
    set enabled(value: boolean) {
        if (!this.forceDisabled) {
            this._enabled = value;
        }
    }
}
