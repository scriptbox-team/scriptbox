import { EntityProxy } from "entity";
import MetaInfo, { MetaInfoProxy } from "meta-info";
import { PlayerProxy } from "player";

export interface ComponentInfoProxy extends MetaInfoProxy {
    readonly id: string;
    readonly entity: EntityProxy;
    readonly lastFrameTime: number;
}

export default class ComponentInfo extends MetaInfo {
    public id: string;
    public entity: EntityProxy;
    public lastFrameTime: number;
    constructor(
            id: string,
            entity: EntityProxy,
            name: string,
            description: string,
            enabled: boolean,
            exists: boolean,
            owner?: PlayerProxy) {
        super(name, description, enabled, exists, owner);
        this.id = id;
        this.entity = entity;
        this.lastFrameTime = 0;
    }
}
