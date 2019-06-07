import Module from "./module";

/**
 * A proxy for entity methods which fetch information from the entity manager.
 * This exists to prevent user scripts from having direct access to the entity manager.
 *
 * @export
 * @class EntityManagerInterface
 */
export default class EntityManagerInterface {
    /**
     * Check for whether the entity of a specified ID exists.
     *
     * @memberof EntityManagerInterface
     */
    public entityExists: (id: number) => boolean;
    /**
     * Get a module of a particular name belonging to an entity of a specified ID.
     * Returns the module if it finds it, null otherwise.
     *
     * @memberof EntityManagerInterface
     */
    public getModule: (id: number, name: string) => Module | null;
    /**
     * Creates an instance of EntityManagerInterface.
     * @param {(id: number) => boolean} entityExists The function to be called when checking for entity existence
     * @param {((id: number, name: string) => Module | null)} getModule The function to be called for getting a module
     * @memberof EntityManagerInterface
     */
    constructor(entityExists: (id: number) => boolean, getModule: (id: number, name: string) => Module | null) {
        this.entityExists = entityExists;
        this.getModule = getModule;
    }
}
