import Entity from "./entity";
import EntityManagerInterface from "./entity-manager-interface";
import Module from "./module";

/**
 * A manager for handling everything related to entity information.
 * This includes entity creation and deletion, and module management and ownership.
 *
 * @export
 * @class EntityManager
 */
export default class EntityManager {
    private _modules: Map<number, Map<string, Module>> = new Map<number, Map<string, Module>>();
    private _nextEntityID: number = 0;

    /**
     * Creates an instance of EntityManager.
     * @memberof EntityManager
     */
    constructor() {
        this.getModule = this.getModule.bind(this);
        this.entityExists = this.entityExists.bind(this);
    }

    /**
     * Get a single module of a particular name belonging to an entity of a particular ID.
     *
     * @param {number} id The ID of the entity to find the module from
     * @param {string} moduleName The name of the module
     * @returns {(Module | null)} The module if the entity owns such a module, null otherwise
     * @memberof EntityManager
     */
    public getModule(id: number, moduleName: string): Module | null {
        const entModules = this.getModules(id);
        const module = entModules.get(moduleName);
        return module === undefined ? null : module;
    }

    /**
     * Add a module to an entity, assigning the module a particular name.
     *
     * @param {number} id The ID of the entity to add the module to
     * @param {string} moduleName The name to be assigned to the module
     * @param {Module} module The module to add to the entity
     * @memberof EntityManager
     */
    public addModule(id: number, moduleName: string, module: Module) {
        const entModules = this.getModules(id);
        entModules.set(moduleName, module);
    }

    /**
     * Get all of the modules which belong to an entity.
     *
     * @param {number} id The ID of the entity to get the modules for.
     * @returns {Map<string, Module>} A map of module names to module objects
     * @memberof EntityManager
     */
    public getModules(id: number): Map<string, Module> {
        const entModules = this._modules.get(id);
        if (entModules === undefined) {
            throw new Error("Entity of ID " + id + " does not exist");
        }
        return entModules;
    }

    /**
     * Check if an entity exists.
     *
     * @param {number} id The ID of the entity to check.
     * @returns True if entity exists, false if it never existed or was deleted.
     * @memberof EntityManager
     */
    public entityExists(id: number) {
        return this._modules.has(id);
    }

    /**
     * Converts an entity ID to a usable entity object with appropriate methods.
     *
     * @param {number} id The ID of the entity to get an object for
     * @returns {Entity} An entity object correlating to the entity of the given ID
     * @memberof EntityManager
     */
    public idToPlayerObject(id: number): Entity {
        const entity = new Entity(id, new EntityManagerInterface(this.entityExists, this.getModule));
        return entity;
    }

    /**
     * Create an entity. This automatically determines the entity ID of the new entity.
     *
     * @returns {Entity} An object representing the entity.
     * @memberof EntityManager
     */
    public createEntity(): Entity {
        const id = this._nextEntityID++;
        this._modules.set(id, new Map<string, Module>());
        return this.idToPlayerObject(id);
    }
}
