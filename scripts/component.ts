import IComponentProtectedInfo from "./component-info";

const dataWeakmap = new WeakMap<Component, IComponentProtectedInfo>();

export default class Component {
    constructor(info: IComponentProtectedInfo) {
        dataWeakmap.set(this, info);
    }
    public update() {

    }
    public postUpdate() {

    }
    public get id() {
        return dataWeakmap.get(this)!.id;
    }
    public get localID() {
        return this.entity.getComponentLocalID(this)!;
    }
    public set localID(newID: string) {
        if (this.entity !== undefined) {
            this.entity.setComponentLocalID(this, newID);
        }
    }
    public get entity() {
        return dataWeakmap.get(this)!.entity;
    }
    public get exists() {
        return dataWeakmap.get(this)!.exists;
    }
    public get enabled() {
        return dataWeakmap.get(this)!.enabled;
    }
    public get name() {
        return dataWeakmap.get(this)!.name;
    }
    public set name(newName: string) {
        dataWeakmap.get(this)!.name = newName;
    }
    public get description() {
        return dataWeakmap.get(this)!.description;
    }
    public set description(newDescription: string) {
        dataWeakmap.get(this)!.description = newDescription;
    }
}
