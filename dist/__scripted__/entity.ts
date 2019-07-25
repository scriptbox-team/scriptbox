import EntityManagerInterface from "./entity-manager-interface";
import Module from "./module";

const interfaceWeakmap = new WeakMap<Entity, EntityManagerInterface>();

/**
 * Represents an entity, which is essentially an ID linking to a set of components.
 * All of an entity's data is contained within the EntityManager. For safety reasons, this
 * data is retrieved through the use of an EntityManagerInterface.
 *
 * @export
 * @class Entity
 */
export default class Entity {
    /**
     * Creates an instance of Entity.
     * This should only be used by the EntityManager.
     * @param {number} id The ID of the Entity
     * @param {EntityManagerInterface} entityManagerInterface The interface of functions to call.
     * @memberof Entity
     */
    constructor(id: number, entityManagerInterface: EntityManagerInterface) {
        interfaceWeakmap.set(this, entityManagerInterface);
    }
    /**
     * Get a module belonging to this entity
     *
     * @param {string} name The name of the module
     * @returns {(Module | null)} A module object if the module exists in the entity, false otherwise
     * @memberof Entity
     */
    public get<T extends Module = any>(name: string): T | null {
        return interfaceWeakmap.get(this).getModule<T>(name);
    }

    public with<T extends Module = any>(name: string, func: (t: T) => void) {
        const module = this.get(name);
        if (module !== null) {
            func(module as T);
        }
    }

    public withMany<T extends Module[] = any[]>(names: string[], func: (t: T) => void) {
        const modules = [];
        for (const name of names) {
            const module = this.get(name);
            if (module === null) {
                return;
            }
            modules.push(module);
        }
        func(modules as T);
    }
    /**
     * Get whether this entity exists or not.
     *
     * @readonly
     * @type {boolean}
     * @memberof Entity
     */
    get exists(): boolean {
        return interfaceWeakmap.get(this).entityExists();
    }

    get id(): number {
        return interfaceWeakmap.get(this).getID();
    }
}
