import Aspect from "./aspect";
import AspectSet from "./aspect-set";
import Component from "./component";
import Map from "./map";
import MetaInfo from "./meta-info";
import Player, { PlayerProxy } from "./player";
import WeakMap from "./weak-map";

export interface EntityProxy {
    readonly delete: () => void;
    readonly add: (
        componentClassID: string,
        localID: string,
        owner?: PlayerProxy | undefined,
        ...params: any[]) => any;
    readonly remove: (component: Component) => void;
    readonly get: <T extends Component = any>(name: string) => T | undefined;
    readonly with: <T extends Component = any>(name: string, func: (t: T) => void) => any;
    readonly withMany: <T extends Component[] = any[]>(names: string[], func: (t: T) => void) => any;
    readonly getComponentLocalID: (component: Component) => string;
    readonly setComponentLocalID: (component: Component, newID: string) => void;
    readonly componentIterator: () => IterableIterator<Component>;
    readonly enabled: boolean;
    readonly exists: boolean;
    readonly controller?: Player;
    readonly id: string;
    readonly reload: () => void;
}

interface EntityManagementMethods {
    delete: (entityID: string) => void;
    add: (
        entityID: string,
        componentClassID: string,
        localID: string,
        owner?: string | undefined,
        ...params: any[]) => any;
    remove: (entityID: string, component: Component) => void;
}

/**
 * Represents an entity, which is essentially an ID linking to a set of components.
 * All of an entity's data is contained within the EntityManager. For safety reasons, this
 * data is retrieved through the use of an EntityManagerInterface.
 *
 * @export
 * @class Entity
 */
export default class Entity {
    public static readOnlyProps = Object.freeze([
        "create",
        "delete",
        "add",
        "remove",
        "with",
        "withMany",
        "get",
        "getComponentLocalID",
        "setComponentLocalID",
        "enabled",
        "exists",
        "controller",
        "id",
        "clearComponents"
    ]);
    public static hiddenProps = Object.freeze([
        "directAdd",
        "directRemove",
        "_components",
        "_componentsInverse",
        "_id",
        "_controller",
        "_creator",
        "_metaInfo",
        "_add",
        "_remove",
        "_delete",
        "_create"
    ]);
    public static externalCreate: (creatorID: string | undefined) => string;
    public static externalFromID: (id: string) => EntityProxy;
    public static create(prefabID: string, owner?: PlayerProxy) {
        return this.fromID(this.externalCreate(owner !== undefined ? owner.id : owner));
    }
    public static fromID(id: string) {
        return this.externalFromID(id);
    }
    public tags: AspectSet<string>;
    private _delete!: (entityID: string) => void;
    private _add!: (
        entityID: string,
        componentClassID: string,
        localID: string,
        owner?: string | undefined,
        ...params: any[]) => string;
    private _remove!: (entityID: string, component: Component) => void;
    private _components: Map<string, Component>;
    private _componentsInverse: WeakMap<Component, string>;
    private _id: string;
    private _controller?: PlayerProxy;
    private _metaInfo: MetaInfo;
    private _eventID: number = 0;
    /**
     * Creates an instance of Entity.
     * This should only be used by the EntityManager.
     * @param {number} id The ID of the Entity
     * @param {EntityManagerInterface} entityManagerInterface The interface of functions to call.
     * @memberof Entity
     */
    constructor(id: string, methods: EntityManagementMethods, metaInfo: MetaInfo, controller?: PlayerProxy) {
        for (const func of [
            "delete",
            "add",
            "remove",
            "beginEvent",
            "get",
            "with",
            "withMany",
            "getComponentLocalID",
            "setComponentLocalID",
            "clearComponents",
            "componentIterator"
        ]) {
            (this as any)[func] = ((this as any)[func] as (...args: any) => any).bind(this);
        }

        this._id = id;
        this._metaInfo = metaInfo;
        this._controller = controller;
        this._components = new Map<string, Component>();
        this._componentsInverse = new WeakMap<Component, string>();
        this._delete = methods.delete;
        this._add = methods.add;
        this._remove = methods.remove;
        this.tags = new AspectSet<string>([]);
    }
    public delete() {
        this._delete(this._id);
    }
    public onDelete() {
        for (const [id, component] of this._components) {
            this.remove(component);
        }
    }
    public add(componentClassID: string, localID: string, owner?: PlayerProxy, ...params: any[]) {
        const componentID = this._add(
            this._id,
            componentClassID,
            localID,
            owner !== undefined ? owner.id : undefined,
            ...params
        );
        return Component.fromID(componentID);
    }
    public remove(component: Component) {
        this._remove(this._id, component);
    }
    public directAdd(localID: string, component: Component) {
        this._components.set(localID, component);
        this._componentsInverse.set(component, localID);
    }
    public directRemove(localID: string) {
        const component = this._components.get(localID);
        if (component !== undefined) {
            this._components.delete(localID);
            this._componentsInverse.delete(component);
        }
    }
    public beginEvent(owner?: PlayerProxy) {
        const id = "event-" + this._eventID++;
        this._add(this._id, "event-component", id, owner !== undefined ? owner.id : undefined);
        return this._components.get(id);
    }
    /**
     * Get a component belonging to this entity
     *
     * @param {string} name The name of the component
     * @returns {(Component | undefined)} A component object if the component exists in the entity, undefined otherwise
     * @memberof Entity
     */
    public get<T extends Component = any>(name: string): T | undefined {
        return this._components.get(name) as T;
    }

    public componentIterator() {
        return this._components.values();
    }

    public with<T extends Component = any>(name: string, func: (t: T) => any) {
        const component = this.get(name);
        if (component !== undefined) {
            return func(component as T);
        }
    }

    public withMany<T extends Component[] = any[]>(names: string[], func: (t: T) => any) {
        const components = [];
        for (const name of names) {
            const component = this.get(name);
            if (component === undefined) {
                return;
            }
            components.push(component);
        }
        return func(components as T);
    }
    public clearComponents() {
        for (const [localID, component] of this._components) {
            this._components.delete(localID);
        }
    }
    public getComponentLocalID(component: Component) {
        return this._componentsInverse.get(component);
    }
    public setComponentLocalID(component: Component, newID: string) {
        if (this._components.has(newID)) {
            throw new Error(`Entity ${this.id} already has a component with a local ID of ${newID}.`);
        }
        const currentLocalID = this._componentsInverse.get(component);
        if (currentLocalID !== undefined) {
            this._components.delete(currentLocalID);
            this._components.set(newID, component);
            this._componentsInverse.set(component, newID);
        }
    }
    /**
     * Get whether this entity exists or not.
     *
     * @readonly
     * @type {boolean}
     * @memberof Entity
     */
    public get exists(): boolean {
        return this._metaInfo.exists;
    }

    // Note: Function not exposed to player scripting
    public set exists(value: boolean) {
        this._metaInfo.exists = value;
    }

    public get enabled() {
        return this._metaInfo.enabled;
    }

    public get controller() {
        return this._controller;
    }
    // Note: Function not exposed to player scripting
    public set controller(value: PlayerProxy | undefined) {
        this._controller = value;
    }

    public get owner() {
        return this._metaInfo.owner;
    }

    public get id(): string {
        return this._id;
    }

    public get displayData() {
        return {id: this.id};
    }

    public reload() {
        const componentEntries = this._components.entries();
        for (const [id, component] of componentEntries) {
            this._componentsInverse.set(component, id);
        }
        for (const [localID, component] of this._components) {
            component.onUnload();
        }
        for (const [localID, component] of this._components) {
            component.onLoad();
        }
    }
}
