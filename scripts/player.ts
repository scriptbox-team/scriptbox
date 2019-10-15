import Entity from "./entity";
import PlayerSoul from "./player-soul";

export interface PlayerProxy {
    readonly id: string;
    readonly username: string;
    displayName: string;
    readonly controllingEntity: Entity;
    controlSet: {[input: string]: string};
    readonly locked: boolean;
    readonly possess: (entity: Entity) => boolean;
    readonly unpossess: () => void;
}

export default class Player {
    public static readOnlyProps = Object.freeze([
        "id",
        "username",
        "controllingEntity",
        "locked",
        "possess",
        "unpossess",
        "exists"
    ]);
    public static hiddenProps = Object.freeze([
        "_displayName",
        "_controllingEntity",
        "_controlSet",
        "_locked",
        "_soulData",
        "_id",
        "_username"
    ]);
    private _displayName: string;
    private _controllingEntity?: Entity;
    private _controlSet: {[input: string]: string};
    private _locked: boolean;
    private _soulData: PlayerSoul;
    private _id: string;
    private _username: string;
    private _exists: boolean;
    constructor(
            id: string,
            username: string,
            displayName: string,
            controlSet: {[id: number]: string},
            soulData: PlayerSoul,
            controllingEntity?: Entity) {
        this._id = id;
        this._username = username;
        this._displayName = displayName;
        this._controlSet = controlSet;
        this._controllingEntity = controllingEntity;
        this._soulData = soulData;
        this._locked = true;
        this._exists = true;
    }
    public get id() {
        return this._id;
    }
    public get username() {
        return this._username;
    }
    public get displayName() {
        return this._displayName;
    }
    public set displayName(value: string) {
        this._restrictedSetDisplayName(value);
    }
    public get controllingEntity() {
        return this._controllingEntity;
    }
    public get controlSet() {
        return this._controlSet;
    }
    public set controlSet(value: {[input: string]: string}) {
        this._restrictedSetControlSet(value);
    }
    public get locked() {
        return this._locked;
    }
    public get exists() {
        return this._exists;
    }
    // Hidden from player scripting
    public set exists(value: boolean) {
        this._exists = value;
    }
    public unpossess() {
        this._locked = true;
        this._controllingEntity = undefined;
    }
    public possess(entity: Entity) {
        if (entity.controller === undefined) {
            if (this._controllingEntity !== undefined) {
                this._controllingEntity.controller = undefined;
            }
            this._controllingEntity = entity;
            entity.controller = this;
            this._locked = false;
            return true;
        }
        return false;
    }
    private _restrictedSetDisplayName(value: string) {
        if (!this.locked) {
            this.displayName = value;
        }
    }
    private _restrictedSetControlSet(value: {[input: string]: string}) {
        if (!this.locked) {
            this.controlSet = value;
        }
    }
}
