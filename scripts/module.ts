import EntityManagerModuleInterface from "./entity-manager-module-interface";

const interfaceWeakmap = new WeakMap<Module, EntityManagerModuleInterface>();

export default class Module {
    public tags: string[] = [];
    constructor(entityManagerModuleInterface: EntityManagerModuleInterface) {
        interfaceWeakmap.set(this, entityManagerModuleInterface);
    }
    public update() {

    }
    public postUpdate() {

    }
    public get id() {
        return interfaceWeakmap.get(this)!.getID();
    }
    public get name() {
        return interfaceWeakmap.get(this)!.getName();
    }
    public get entity() {
        return interfaceWeakmap.get(this)!.getEntity();
    }
    public get exists() {
        return interfaceWeakmap.get(this)!.exists();
    }
}
