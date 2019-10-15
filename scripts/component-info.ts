import Entity from "./entity";
import MetaInfo, { IMetaInfoProxy } from "./meta-info";
import Player from "./player";

export interface IComponentInfoProxy extends IMetaInfoProxy {
    readonly id: string;
    readonly entity: Entity;
}

export default class ComponentInfo extends MetaInfo {
    public id: string;
    public entity: Entity;
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
    }
}
