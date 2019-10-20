import Entity from "./entity";
import MetaInfo, { MetaInfoProxy } from "./meta-info";
import Player from "./player";

export interface ComponentInfoProxy extends MetaInfoProxy {
    readonly id: string;
    readonly entity: Entity;
    readonly lastFrameTime: number;
}

export default class ComponentInfo extends MetaInfo {
    public id: string;
    public entity: Entity;
    public lastFrameTime: number;
    constructor(
            id: string,
            entity: Entity,
            name: string,
            description: string,
            enabled: boolean,
            exists: boolean,
            tags: string[],
            owner?: Player) {
        super(name, description, enabled, exists, tags, owner);
        this.id = id;
        this.entity = entity;
        this.lastFrameTime = 0;
    }
}
