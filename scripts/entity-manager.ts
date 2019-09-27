import Entity from "./entity";
import EntityManagerInterface from "./entity-manager-interface";
import EntityManagerModuleInterface from "./entity-manager-module-interface";
import Module from "./module";

/**
 * A manager for handling everything related to entity information.
 * This includes entity creation and deletion, and module management and ownership.
 *
 * @export
 * @class EntityManager
 */

export default class EntityManager {
    /**
     * Modules indexed by entity ID, then by entity-internal module name
     *
     * @private
     * @type {Map<number, Map<string, Module>>}
     * @memberof EntityManager
     */
    private _modules: Map<number, Map<string, Module>> = new Map<number, Map<string, Module>>();
    private _moduleIDToName: Map<number, string> = new Map<number, string>();
    private _moduleIDToEntityID: Map<number, number> = new Map<number, number>();
    private _deletedEntities: number[] = [];
    private _nextEntityID: number = 0;
    private _nextModuleID: number = 0;

    /**
     * Creates an instance of EntityManager.
     * @memberof EntityManager
     */
    constructor() {
        this.getModule = this.getModule.bind(this);
        this.entityExists = this.entityExists.bind(this);
        (this as any).timestamp = Date.now();
    }

    /**
     * Get a single module of a particular name belonging to an entity of a particular ID.
     *
     * @param {number} id The ID of the entity to find the module from
     * @param {string} moduleName The name of the module
     * @returns {(Module | null)} The module if the entity owns such a module, null otherwise
     * @memberof EntityManager
     */
    public getModule<T extends Module>(id: number, moduleName: string): T | null {
        const entModules = this.getModules(id);
        const module = entModules.get(moduleName);
        return module === undefined ? null : module as T;
    }

    public getAllModules(): Map<number, Map<string, Module>> {
        return this._modules;
    }

    /**
     * Add a module to an entity, assigning the module a particular name.
     *
     * @param {number} id The ID of the entity to add the module to
     * @param {string} moduleName The name to be assigned to the module
     * @param {Module} module The module to add to the entity
     * @memberof EntityManager
     */
    // tslint:disable
    public createModule<T extends Module>(type: {new(...args: any[]):  T}, moduleName: string, entityID: number, ...params: any) {
        // tslint:enable
        const entModules = this.getModules(entityID);
        const id = this._nextModuleID++;
        const module = new type(new EntityManagerModuleInterface(
            () => this.getEntityByModuleID(id),
            () => this.getModuleNameByID(id),
            () => {
                const entID = this.getEntityIDByModuleID(id);
                if (entID === null) {
                    return false;
                }
                return this.entityExists(entID);
            },
            () => id
        ));
        if (typeof (module as any).create === "function") {
            (module as any).create(...params);
        }
        entModules.set(moduleName, module);
        this._moduleIDToEntityID.set(id, entityID);
        this._moduleIDToName.set(id, moduleName);
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
            // throw new Error((this as any).timestamp);
            throw new Error("Entity of ID " + id + " does not exist");
        }
        return entModules;
    }

    public deleteModule(moduleID: number) {
        const moduleName = this._moduleIDToName.get(moduleID);
        const entID = this._moduleIDToEntityID.get(moduleID);
        if (moduleName !== undefined) {
            if (entID !== undefined && moduleName !== undefined) {
                const entModules = this.getModules(entID);
                const module = entModules.get(moduleName);
                if (typeof (module as any).delete === "function") {
                    (module as any).delete();
                }
                if (entModules.has(moduleName)) {
                    entModules.delete(moduleName);
                }
                this._moduleIDToEntityID.delete(moduleID);
            }
            this._moduleIDToName.delete(moduleID);
        }
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
    public idToEntityObject(id: number): Entity {
        const entity = new Entity(id, new EntityManagerInterface(
            () => this.entityExists(id),
            (name: string) => this.getModule(id, name),
            () => id
        ));
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
        return this.idToEntityObject(id);
    }

    public deleteEntityByID(id: number) {
        this._deletedEntities.push(id);
        this._modules.delete(id);
    }

// TODO: Reconsider usage of "null" in certain cases (maybe better to be undefined?)

    public getEntityByModuleID(moduleID: number): Entity | null {
        const id = this.getEntityIDByModuleID(moduleID);
        if (id === null) {
            return null;
        }
        return this.idToEntityObject(id);
    }

    public getEntityIDByModuleID(moduleID: number): number | null {
        const id = this._moduleIDToEntityID.get(moduleID);
        return id !== undefined ? id : null;
    }

    public getModuleNameByID(moduleID: number): string {
        const name = this._moduleIDToName.get(moduleID);
        return name !== undefined ? name : "";
    }

    public cleanupDeletedEntities() {
        for (const id of this._deletedEntities) {
            const modules = this._modules.get(id);
            if (modules !== undefined) {
                const keys = modules.keys();
                for (const key of keys) {
                    const module = modules.get(key)!;
                    if (typeof (module as any).delete === "function") {
                        (module as any).delete();
                        this._moduleIDToName.delete(module.id);
                        this._moduleIDToEntityID.delete(module.id);
                    }
                }
                this._modules.delete(id);
            }
        }
        this._deletedEntities = [];
    }
}
