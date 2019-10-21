import Entity, {EntityProxy} from "./entity";
import PlayerSoul from "./player-soul";

export interface PlayerProxy {
    readonly id: string;
    readonly username: string;
    displayName: string;
    readonly controllingEntity: EntityProxy;
    controlSet: {[input: string]: string};
    readonly locked: boolean;
    readonly control: (entity: EntityProxy) => boolean;
    readonly release: () => void;
}

export default class Player {
    public static readOnlyProps = Object.freeze([
        "id",
        "username",
        "controllingEntity",
        "locked",
        "control",
        "release",
        "exists"
    ]);
    public static hiddenProps = Object.freeze([
        "_displayName",
        "_controllingEntity",
        "_controlSet",
        "_locked",
        "_soulData",
        "_id",
        "_username",
        "_removeControl",
        "trueEntityFromEntity"
    ]);
    public trueEntityFromEntity!: (entity: EntityProxy) => Entity;
    private _displayName: string;
    private _controllingEntity?: EntityProxy;
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
            controllingEntity?: EntityProxy) {
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
    public release() {
        this._removeControl();
    }
    public control(entity: EntityProxy) {
        if (entity.controller === undefined) {
            this._removeControl();
            this._controllingEntity = entity;
            const trueEntity = this.trueEntityFromEntity(entity);
            trueEntity.controller = this;
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
    private _removeControl() {
        if (this._controllingEntity !== undefined) {
            const trueControllingEntity = this.trueEntityFromEntity(this._controllingEntity);
            trueControllingEntity.controller = undefined;
        }
        this._locked = true;
        this._controllingEntity = undefined;
    }
    public get displayData() {
        return {id: this.id};
    }
}
