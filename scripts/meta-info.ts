import { PlayerProxy } from "player";

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
    private _forceDisabled: boolean;
    constructor(
            name: string,
            description: string,
            enabled: boolean,
            exists: boolean,
            owner?: PlayerProxy) {
        this.name = name;
        this.description = description;
        this.owner = owner;
        this._enabled = enabled;
        this.exists = exists;
        this._forceDisabled = false;
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
