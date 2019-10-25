import Aspect from "./aspect";
import ComponentInfo from "./component-info";

export default class Component {
    public tags = new Aspect(new Set<string>([]));
    private _data: ComponentInfo;
    constructor(data: ComponentInfo) {
        this._data = data;
    }
    public update() {

    }
    public postUpdate() {

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
