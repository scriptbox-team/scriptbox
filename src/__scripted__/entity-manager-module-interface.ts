import Entity from "./entity";

export default class EntityManagerModuleInterface {
    public getEntity: () => Entity | null;
    public getName: () => string;
    public exists: () => boolean;
    public getID: () => number;
    /**
     * Creates an instance of EntityManagerInterface.
     * @param {(id: number) => boolean} entityExists The function to be called when checking for entity existence
     * @param {((id: number, name: string) => Module | null)} getModule The function to be called for getting a module
     * @memberof EntityManagerInterface
     */
    constructor(getEntity: () => Entity | null, getName: () => string, exists: () => boolean, getID: () => number) {
        this.getEntity = getEntity;
        this.getName = getName;
        this.exists = exists;
        this.getID = getID;
    }
}
