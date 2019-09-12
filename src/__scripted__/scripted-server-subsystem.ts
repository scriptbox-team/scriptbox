import Aspect from "./aspect"
import CollisionBox from "./collision-box";
import Control from "./control";
import DefaultControl from "./default-control";
import Entity from "./entity";
import EntityManager from "./entity-manager";
import Module from "./module";
import Position from "./position";
import Velocity from "./velocity";

//tslint:disable
type IClassInterface = {new (...args: any[]): any};
// tslint:enable

interface IComponentInfo {
    name: string;
    attributes: Array<{name: string, kind: string, value: string}>;
}

interface IEntityInfo {
    id: number;
    name: string;
    componentInfo: {[localID: string]: IComponentInfo};
}

interface IExports {
    entities: {[id: string]: {
        position: {x: number, y: number},
        collisionBox: {x1: number, y1: number, x2: number, y2: number}
    }};
    watchedEntityInfo: {[watcherID: string]: IEntityInfo};
}

const exportValues: IExports = {
    entities: {},
    watchedEntityInfo: {}
};

global.exportValues = exportValues;

const classList = new Map<string, IClassInterface>();
const entityManager = new EntityManager();
const watchedEntities: {[playerID: string]: number} = {};

export function update() {
    // For each component, call update function if exists
    // This code should really be handled its own iterator inside of the EntityManager class
    const allModules = entityManager.getAllModules();
    let entityIDIterator = allModules.keys();
    for (const id of entityIDIterator) {
        const entityModuleMap = entityManager.getModules(id);
        const moduleIterator = entityModuleMap.keys();
        for (const moduleName of moduleIterator) {
            const module = entityModuleMap.get(moduleName);
            try {
                if ("update" in module && typeof (module as any).update === "function") {
                    (module as any).update();
                }
            }
            catch (err) {
                if (module instanceof Module) {
                    const owner = (module as Module).entity;
                    // TODO: Notify the entity owner if their code errors
                }
                global.log("Update Error: " + err);
            }
        }
    }
    // We need a new iterator since we reached the end of the last one
    entityIDIterator = allModules.keys();
    for (const id of entityIDIterator) {
        const entityModuleMap = entityManager.getModules(id);
        const moduleIterator = entityModuleMap.keys();
        for (const moduleName of moduleIterator) {
            const module = entityModuleMap.get(moduleName);
            try {
                if ("postUpdate" in module && typeof (module as any).postUpdate === "function") {
                    (module as any).postUpdate();
                }
            }
            catch (err) {
                if (module instanceof Module) {
                    const owner = (module as Module).entity;
                    // TODO: Notify the entity owner if their code errors
                }
                global.log("postUpdate Error: " + err);
            }
        }
    }
    // We need a new iterator since we reached the end of the last one
    entityIDIterator = allModules.keys();
    entityManager.cleanupDeletedEntities();
    // After the update and postupdate are called we should let the exports know about important changes
    exportValues.entities = {};
    for (const id of entityIDIterator) {
        exportValues.entities["" + id] = {
            position: {x: 0, y: 0},
            collisionBox: {x1: 0, y1: 0, x2: 0, y2: 0}
        };
        const entityModuleMap = entityManager.getModules(id);
        // Retrieve position info
        try {
            const positionModule = entityModuleMap.get("position") as Position;
            if (positionModule !== null) {
                if (typeof positionModule.x === "object"
                && typeof positionModule.y === "object"
                && typeof positionModule.x.getValue === "function"
                && typeof positionModule.y.getValue === "function"
                && positionModule.entity instanceof Entity
                ) {
                    const x = positionModule.x.getValue();
                    const y = positionModule.y.getValue();
                    if (typeof x === "number" && typeof y === "number" && typeof id === "number") {
                        exportValues.entities["" + id].position = {x, y};
                    }
                }
            }
        }
        catch (err) {
            global.log("Retrieval Error: " + err);
        }
        // Retrieve collision box info
        try {
            const collisionModule = entityModuleMap.get("collision-box") as CollisionBox;
            if (collisionModule !== undefined) {
                if (typeof collisionModule.x1 === "object"
                && typeof collisionModule.y1 === "object"
                && typeof collisionModule.x1.getValue === "function"
                && typeof collisionModule.y1.getValue === "function"
                && typeof collisionModule.x2 === "object"
                && typeof collisionModule.y2 === "object"
                && typeof collisionModule.x2.getValue === "function"
                && typeof collisionModule.y2.getValue === "function"
                && collisionModule.entity instanceof Entity
                ) {
                    const x1 = collisionModule.x1.getValue();
                    const y1 = collisionModule.y1.getValue();
                    const x2 = collisionModule.x2.getValue();
                    const y2 = collisionModule.y2.getValue();
                    if (typeof x1 === "number" && typeof y1 === "number"
                    && typeof x2 === "number" && typeof y2 === "number"
                    && typeof id === "number") {
                        exportValues.entities["" + id].collisionBox = {
                            x1: Math.min(x1, x2),
                            x2: Math.min(y1, y2),
                            y1: Math.max(x1, x2),
                            y2: Math.max(y1, y2)
                        };
                    }
                }
            }
        }
        catch (err) {
            global.log("Retrieval Error: " + err);
        }
        // A sanity check to prevent a collision box of width or height less than 1
        const box = exportValues.entities["" + id].collisionBox;
        if (box.x2 - box.x1 < 1 || box.y2 - box.y1 < 1) {
            box.x2 = box.x1 + 1;
            box.y2 = box.x1 + 1;
        }
    }
    // Retrieve watched object information
    const playersWatching = Object.keys(watchedEntities);
    for (const player of playersWatching) {
        const entityID = watchedEntities[player];
        if (!entityManager.entityExists(entityID)) {
            continue;
        }
        const components = entityManager.getModules(entityID);
        const componentInfo = Array.from(components.values()).reduce((acc, component) => {
            acc[component.name] = getComponentInfo(component);
            return acc;
        }, {});
        const entityInfo: IEntityInfo = {
            id: entityID,
            name: "Entity " + entityID, // temporary
            componentInfo
        };
        exportValues.watchedEntityInfo[player] = entityInfo;
    }
}

// TODO: Convert all instances of "module" to "component"

function getComponentInfo(component: Module): IComponentInfo {
    const keys = Object.keys(component);
    const attributes = keys.map((key) => {
        let value = component[key];
        // If it's an aspect, we should use the base value
        // TODO: Also export the result value of the aspect
        if (value instanceof Aspect) {
            value = value.base;
        }
        let kind: string = typeof value;
        if (value instanceof Module) {
            kind = "module";
        }
        return {
            name: key,
            kind,
            value: JSON.stringify(value)
        };
    });
    return {
        name: component.name,
        attributes
    };
}

export function call(entID: number, compName: string, funcName: string, ...args: any[]) {
    // Call a function on a component if it exists
    const module = entityManager.getModule(entID, compName);
    if (module !== null && funcName in module && typeof (module as any)[funcName] === "function") {
        return (module as any)[funcName](...args);
    }
}

export function get(entID: number, compName: string, propName: string) {
    // Get a property from a component if it exists
    const module = entityManager.getModule(entID, compName);
    if (module !== null && propName in module) {
        return (module as any)[propName];
    }
    return undefined;
}

export function createEntity(): number {
    const ent = entityManager.createEntity();
    global.log("Entity created (ID: " + ent.id + ")");
    return ent.id;
}

export function deleteEntity(id: number) {
    entityManager.deleteEntityByID(id);
    global.log("Entity deleted (ID: " + id + ")");
}

export function createModule(entID: number, className: string, uniqueName: string, ...params: any) {
    const classToCreate = classList.get(className);
    entityManager.createModule(classToCreate, uniqueName, entID, ...params);
    global.log(
        "Module created (Entity ID: "
        + entID
        + ", Module Name: "
        + uniqueName
        + ", Params: "
        + JSON.stringify(params)
        +  ")");
}

export function create(classParam: string | IClassInterface, ...args: any[]) {
    let classToCreate: IClassInterface;
    if (typeof classParam === "string") {
        classToCreate = classList.get(classParam);
    }
    else {
        classToCreate = classParam;
    }
    if (typeof classToCreate === "function") {
        return new classToCreate(...args);
    }
}

export function handleInput(entityID: number, input: string, state: InputType) {
    if (!entityManager.entityExists(entityID)) {
        return;
    }
    const module = entityManager.getModule(entityID, "control");
    if (module instanceof Control) {
        switch (state) {
            case InputType.Press: {
                if (typeof module.sendKeyPress === "function") {
                    module.sendKeyPress(input);
                }
                break;
            }
            case InputType.Release: {
                if (typeof module.sendKeyRelease === "function") {
                    module.sendKeyRelease(input);
                }
                break;
            }
        }
    }
}

export function setModuleClass(classObj: IClassInterface, id: string) {
    if (classObj.prototype instanceof Module) {
        // TODO: If a module class already exists on upload, re-instantiate instances of it with the new version
        classList.set(id, classObj);
    }
}

export function watchEntity(playerID: number, entityID?: number) {
    watchedEntities["" + playerID] = entityID;
    // TODO: Replace all number IDs with strings
    // TODO: Fix the compiler freaking out about things in __scripted__
}

/**
 * The type of an input.
 * Press and Release are for buttons, and move is for axes.
 *
 * @export
 * @enum {number}
 */
enum InputType {
    Press = 0,
    Release = 1,
    Move = 2
}

/**
 * The type of device an input came from
 *
 * @export
 * @enum {number}
 */
enum DeviceType {
    Keyboard = 0,
    Mouse = 1,
    Controller = 2
}

classList.set("position", Position);
classList.set("velocity", Velocity);
classList.set("collision-box", CollisionBox);
classList.set("default-control", DefaultControl);
