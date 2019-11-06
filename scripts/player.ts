import Aspect from "./aspect";
import Entity, { EntityProxy } from "./entity";
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
        "exists",
        "camera"
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
        "trueEntityFromEntity",
        "proxy"
    ]);
    public trueEntityFromEntity!: (entity: EntityProxy) => Entity;
    public camera: {
        x: Aspect<number>,
        y: Aspect<number>,
        scale: Aspect<number>
    };
    private _displayName: string;
    private _controllingEntity?: EntityProxy;
    private _controlSet: {[input: string]: string};
    private _locked: boolean;
    private _soulData: PlayerSoul;
    private _id: string;
    private _username: string;
    private _proxy!: PlayerProxy;
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
        this.camera = {
            x: new Aspect<number>(0),
            y: new Aspect<number>(0),
            scale: new Aspect<number>(2)
        };
    }
    public set proxy(value: PlayerProxy) {
        this._proxy = value;
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
            trueEntity.controller = this._proxy;
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
            trueControllingEntity.with("position", (position) => {
                this._soulData.setPosition(position.x.getValue(), position.y.getValue());
            });
            if (typeof this._soulData.position.x !== "number" || typeof this._soulData.position.y !== "number") {
                this._soulData.position = {x: 0, y: 0};
            }
            this._soulData.setVelocity(-10, -10);
            this.camera = {
                x: new Aspect<number>(this._soulData.position.x),
                y: new Aspect<number>(this._soulData.position.y),
                scale: new Aspect<number>(2)
            };
            this._soulData.facing = 1;
            trueControllingEntity.controller = undefined;
        }
        this._locked = true;
        this._controllingEntity = undefined;
    }
    public get displayData() {
        return {id: this.id};
    }
}
