import Component from "./component";
import MetaInfo from "./meta-info";
import Player from "./player";

export interface IEntityProxy {
    readonly add: (localID: string, component: Component) => void;
    readonly remove: (localID: string) => void;
    readonly with: <T extends Component = any>(name: string, func: (t: T) => void) => void;
    readonly withMany: <T extends Component[] = any[]>(names: string[], func: (t: T) => void) => void;
    readonly getComponentLocalID: (component: Component) => string;
    readonly setComponentLocalID: (component: Component, newID: string) => void;
    readonly enabled: boolean;
    readonly exists: boolean;
    readonly controller?: Player;
    readonly id: string;
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
        "add",
        "remove",
        "with",
        "withMany",
        "getComponentLocalID",
        "setComponentLocalID",
        "enabled",
        "exists",
        "controller",
        "id"
    ]);
    public static hiddenProps = Object.freeze([
        "_components",
        "_componentsInverse",
        "_id",
        "_controller",
        "_metaInfo"
    ]);
    private _components: Map<string, Component>;
    private _componentsInverse: WeakMap<Component, string>;
    private _id: string;
    private _controller?: Player;
    private _metaInfo: MetaInfo;
    /**
     * Creates an instance of Entity.
     * This should only be used by the EntityManager.
     * @param {number} id The ID of the Entity
     * @param {EntityManagerInterface} entityManagerInterface The interface of functions to call.
     * @memberof Entity
     */
    constructor(id: string, metaInfo: MetaInfo, controller?: Player) {
        this._id = id;
        this._metaInfo = metaInfo;
        this._controller = controller;
        this._components = new Map<string, Component>();
        this._componentsInverse = new WeakMap<Component, string>();
    }
    public add(localID: string, component: Component) {
        this._components.set(localID, component);
        this._componentsInverse.set(component, localID);
    }
    public remove(localID: string) {
        const component = this._components.get(localID);
        if (component !== undefined) {
            this._components.delete(localID);
            this._componentsInverse.delete(component);
        }
    }
    /**
     * Get a component belonging to this entity
     *
     * @param {string} name The name of the component
     * @returns {(Component | null)} A component object if the component exists in the entity, false otherwise
     * @memberof Entity
     */
    public get<T extends Component = any>(name: string): T | undefined {
        return this._components.get(name) as T;
    }

    public componentIterator() {
        return this._components.values();
    }

    public with<T extends Component = any>(name: string, func: (t: T) => void) {
        const component = this.get(name);
        if (component !== undefined) {
            func(component as T);
        }
    }

    public withMany<T extends Component[] = any[]>(names: string[], func: (t: T) => void) {
        const components = [];
        for (const name of names) {
            const component = this.get(name);
            if (component === undefined) {
                return;
            }
            components.push(component);
        }
        func(components as T);
    }
    public delete() {
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
    get exists(): boolean {
        return this._metaInfo.exists;
    }

    // Note: Function not exposed to player scripting
    set exists(value: boolean) {
        this._metaInfo.exists = value;
    }

    public get enabled() {
        return this._metaInfo.enabled;
    }

    public get controller() {
        return this._controller;
    }
    // Note: Function not exposed to player scripting
    public set controller(value: Player | undefined) {
        this._controller = value;
    }

    get id(): string {
        return this._id;
    }
}
