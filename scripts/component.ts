import Aspect from "./aspect";
import AspectSet from "./aspect-set";
import ComponentInfo from "./component-info";

export default class Component {
    public tags = new AspectSet<string>([]);
    private _data: ComponentInfo;
    constructor(data: ComponentInfo) {
        this._data = data;
    }
    public update(delta: number) {

    }
    public postUpdate(delta: number) {

    }
    public get id() {
        return this._data.id;
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
        return this._data.entity;
    }
    public get exists() {
        return this._data.exists;
    }
    public get enabled() {
        return this._data.enabled;
    }
    public get name() {
        return this._data.name;
    }
    public set name(newName: string) {
        this._data.name = newName;
    }
    public get description() {
        return this._data.description;
    }
    public set description(newDescription: string) {
        this._data.description = newDescription;
    }
    public get displayData() {
        return {id: this.id};
    }
}
