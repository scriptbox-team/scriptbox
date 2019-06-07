import EntityManagerInterface from "./entity-manager-interface";
import Module from "./module";

/**
 * Represents an entity, which is essentially an ID linking to a set of components.
 * All of an entity's data is contained within the EntityManager. For safety reasons, this
 * data is retrieved through the use of an EntityManagerInterface.
 *
 * @export
 * @class Entity
 */
export default class Entity {
    private _id: number;
    private _entityManagerInterface: EntityManagerInterface;
    /**
     * Creates an instance of Entity.
     * This should only be used by the EntityManager.
     * @param {number} id The ID of the Entity
     * @param {EntityManagerInterface} entityManagerInterface The interface of functions to call.
     * @memberof Entity
     */
    constructor(id: number, entityManagerInterface: EntityManagerInterface) {
        this._id = id;
        this._entityManagerInterface = entityManagerInterface;
    }
    /**
     * Get a module belonging to this entity
     *
     * @param {string} name The name of the module
     * @returns {(Module | null)} A module object if the module exists in the entity, false otherwise
     * @memberof Entity
     */
    public module(name: string): Module | null {
        return this._entityManagerInterface.getModule(this._id, name);
    }
    /**
     * Get whether this entity exists or not.
     *
     * @readonly
     * @type {boolean}
     * @memberof Entity
     */
    get exists(): boolean {
        return this._entityManagerInterface.entityExists(this._id);
    }
}
