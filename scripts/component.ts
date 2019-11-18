import Aspect from "./aspect";
import AspectSet from "./aspect-set";
import ComponentInfo from "./component-info";
import { EntityProxy } from "./entity";

export default class Component {
    public static externalFromID: (id: string) => Component | undefined;
    public static fromID(id: string) {
        return this.externalFromID(id);
    }
    public tags = new AspectSet<string>([]);
    private _data: ComponentInfo;
    constructor(data: ComponentInfo) {
        this._data = data;
    }
    public onCreate() {

    }
    public onLoad() {

    }
    public onUpdate(delta: number) {

    }
    public onPostUpdate(delta: number) {

    }
    public onUnload() {

    }
    public onDestroy() {

    }
    public onCollision(other: EntityProxy, dense: boolean, direction?: "up" | "down" | "left" | "right") {

    }
    public destroy() {
        this.entity.remove(this);
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
    public get owner() {
        return this._data.owner;
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
    public get with() {
        return this.entity.with;
    }
}
