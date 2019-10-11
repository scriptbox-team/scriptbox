import Entity from "./entity";
import MetaInfo from "./meta-info";

interface IProtectedComponentData {
    id: string;
    entity: Entity;
    metaInfo: MetaInfo;
}

const dataWeakmap = new WeakMap<Component, IProtectedComponentData>();

export default class Component {
    constructor(id: string, entity: Entity, metaInfo: MetaInfo) {
        dataWeakmap.set(this, {id, entity, metaInfo});
    }
    public update() {

    }
    public postUpdate() {

    }
    public get id() {
        return dataWeakmap.get(this)!.id;
    }
    public get localID() {
        if (this.entity !== undefined) {
            return this.entity.getComponentLocalID(this);
        }
        return undefined;
    }
    public set localID(newID: string) {
        if (this.entity !== undefined) {
            this.entity.setComponentLocalID(this, newID);
        }
    }
    public get entity() {
        return dataWeakmap.get(this)!.entity!;
    }
    public set entity(newEntity: Entity) {
        if (this.entity !== undefined) {
            this.entity.remove(this.localID);
        }
        dataWeakmap.get(this)!.entity = newEntity;
    }
    public get exists() {
        return dataWeakmap.get(this)!.metaInfo.exists;
    }
    public get enabled() {
        return dataWeakmap.get(this)!.metaInfo.enabled;
    }
    public get name() {
        return dataWeakmap.get(this)!.metaInfo.name;
    }
    public set name(newName: string) {
        dataWeakmap.get(this)!.metaInfo.name = newName;
    }
    public get description() {
        return dataWeakmap.get(this)!.metaInfo.description;
    }
    public set description(newDescription: string) {
        dataWeakmap.get(this)!.metaInfo.description = newDescription;
    }
}
