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

interface IExports {
    positions: {[id: string]: {x: number, y: number}};
}

const exportValues: IExports = {
    positions: {}
}
global.exportValues = exportValues;

const classList = new Map<string, IClassInterface>();
const entityManager = new EntityManager();

export function update() {
    // For each component, call update function if exists
    // This code should really be handled its own iterator inside of the EntityManager class
    const allModules = entityManager.getAllModules();
    let entityModuleIterator = allModules.values();
    for (const entityModuleMap of entityModuleIterator) {
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
    entityModuleIterator = allModules.values();
    for (const entityModuleMap of entityModuleIterator) {
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
    entityModuleIterator = allModules.values();
    // After the update and postupdate are called we should let the exports know about important changes
    exportValues.positions = {};
    for (const entityModuleMap of entityModuleIterator) {
        try {
            const positionModule = entityModuleMap.get("position") as Position;
            if (positionModule !== null) {
                if (typeof positionModule.x === "object"
                && typeof positionModule.y === "object"
                && typeof positionModule.x.getValue === "function"
                && typeof positionModule.y.getValue === "function"
                && positionModule.entity instanceof Entity
                ) {
                    const id = positionModule.entity.id;
                    const x = positionModule.x.getValue();
                    const y = positionModule.y.getValue();
                    if (typeof x === "number" && typeof y === "number" && typeof id === "number") {
                        exportValues.positions["" + id] = {x, y};
                    }
                }
            }
        }
        catch (err) {
            global.log("Retrieval Error: " + err);
        }
    }
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
classList.set("default-control", DefaultControl);
