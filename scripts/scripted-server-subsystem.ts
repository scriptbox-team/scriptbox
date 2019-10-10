import Aspect from "./aspect";
import CollisionBox from "./collision-box";
import Component from "./component";
import Control from "./control";
import DefaultControl from "./default-control";
import Entity from "./entity";
import IDGenerator from "./id-generator";
import Manager from "./manager";
import MetaInfo from "./meta-info";
import Position from "./position";
import Velocity from "./velocity";

//tslint:disable
type IClassInterface = {new (...args: any[]): any};
// tslint:enable

const idGenerator = new IDGenerator(Math.random());

const makeID = (prefix: string) => {
    return idGenerator.makeFrom(prefix, Date.now(), Math.random());
};

interface IComponentInfo {
    id: string;
    name: string;
    attributes: Array<{name: string, kind: string, value: string}>;
}

interface IEntityInfo {
    id: string;
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
const entityMeta = new WeakMap<Entity, MetaInfo>();
const entityManager = new Manager<Entity>((id: string) => {
    const info = new MetaInfo(
        `Entity ${id}`,
        "",
        "",
        true,
        true,
    []);
    const entity = new Entity(id, info);
    entityMeta.set(entity, info);
    return entity;
},
(ent: Entity) => {
});
const componentMeta = new WeakMap<Component, MetaInfo>();
const componentManager = new Manager<Component>(
    (componentID: string, componentClass: IClassInterface, entity: Entity, localID: string, ...args: any[]) => {
        const info = new MetaInfo(
            localID,
            "",
            "",
            true,
            true,
        []);
        // TODO: Throw an error if a component doesn't actually extend component
        const component = new componentClass(componentID, entity, info);
        componentMeta.set(component, info);

        if (typeof component.create === "function") {
            component.create(...args);
        }

        return component;
    },
    (component: Component) => {
        if (typeof (component as any).delete === "function") {
            (component as any).delete();
        }
    }
);

const watchedEntities: Map<string, string> = new Map<string, string>();

// TODO: Reconsider all places that use Object.keys (can have undefined values)

function runOnAll(funcName: string) {
    const componentIterator = componentManager.entries();
    for (const [id, component] of componentIterator) {
        try {
            if (funcName in component && typeof (component as any)[funcName] === "function") {
                (component as any)[funcName]();
            }
        }
        catch (err) {
            if (component instanceof Component) {
                const owner = (component as Component).entity;
                // TODO: Notify the entity owner if their code errors
            }
            global.log(`Error during ${funcName}: ${err}`);
        }
    }
}

export function update() {
    // For each component, call update function if exists
    runOnAll("update");
    runOnAll("postUpdate");
    entityManager.deleteQueued();
    componentManager.deleteQueued();
    // After the update and postupdate are called we should let the exports know about important changes
    resetExports();
    // We need a new iterator since we reached the end of the last one
    const entities = entityManager.entries();
    for (const [id, entity] of entities) {
        exportValues.entities[id] = {
            position: {x: 0, y: 0},
            collisionBox: {x1: 0, y1: 0, x2: 0, y2: 0}
        };
        // Retrieve position info
        try {
            const positionComponent = entity.get<Position>("position");
            if (positionComponent !== undefined) {
                if (typeof positionComponent.x === "object"
                && typeof positionComponent.y === "object"
                && typeof positionComponent.x.getValue === "function"
                && typeof positionComponent.y.getValue === "function"
                && positionComponent.entity instanceof Entity
                ) {
                    const x = positionComponent.x.getValue();
                    const y = positionComponent.y.getValue();
                    if (typeof x === "number" && typeof y === "number" && typeof id === "string") {
                        exportValues.entities[id].position = {x, y};
                    }
                }
            }
        }
        catch (err) {
            global.log("Retrieval Error: " + err);
        }
        // Retrieve collision box info
        try {
            const collisionComponent = entity.get<CollisionBox>("collision-box");
            if (collisionComponent !== undefined) {
                if (typeof collisionComponent.x1 === "object"
                && typeof collisionComponent.y1 === "object"
                && typeof collisionComponent.x1.getValue === "function"
                && typeof collisionComponent.y1.getValue === "function"
                && typeof collisionComponent.x2 === "object"
                && typeof collisionComponent.y2 === "object"
                && typeof collisionComponent.x2.getValue === "function"
                && typeof collisionComponent.y2.getValue === "function"
                && collisionComponent.entity instanceof Entity
                ) {
                    const x1 = collisionComponent.x1.getValue();
                    const y1 = collisionComponent.y1.getValue();
                    const x2 = collisionComponent.x2.getValue();
                    const y2 = collisionComponent.y2.getValue();
                    if (typeof x1 === "number" && typeof y1 === "number"
                    && typeof x2 === "number" && typeof y2 === "number"
                    && typeof id === "string") {
                        exportValues.entities[id].collisionBox = {
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
    const playersWatching = watchedEntities.keys();
    for (const player of playersWatching) {
        const entityID = watchedEntities.get(player);
        if (!entityManager.has(entityID)) {
            continue;
        }
        const entity = entityManager.get(entityID);
        const components = Array.from(entity.componentIterator());
        const componentInfo = Array.from(components.values()).reduce((acc, component) => {
            acc[component.localID] = getComponentInfo(component);
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

function getComponentInfo(component: Component): IComponentInfo {
    const keys = Object.keys(component);
    const attributes = keys.map((key) => {
        let value = component[key];
        // If it's an aspect, we should use the base value
        // TODO: Also export the result value of the aspect
        if (value instanceof Aspect) {
            value = value.base;
        }
        let kind: string = typeof value;
        if (value instanceof Component) {
            kind = "component";
        }
        return {
            name: key,
            kind,
            value: JSON.stringify(value)
        };
    });
    return {
        id: component.id,
        name: component.name,
        attributes
    };
}

export function call(entID: string, compLocalID: string, funcName: string, ...args: any[]) {
    // Call a function on a component if it exists
    const entity = entityManager.get(entID);
    if (entity !== undefined) {
        const component = entity.get(entID);
        if (component !== null && funcName in component && typeof (component as any)[funcName] === "function") {
            return (component as any)[funcName](...args);
        }
    }
}

export function get(entID: string, compLocalID: string, propName: string) {
    // Get a property from a component if it exists
    // Call a function on a component if it exists
    const entity = entityManager.get(entID);
    if (entity !== undefined) {
        const component = entity.get(entID);
        if (component !== null && propName in component) {
            return (component as any)[propName];
        }
    }
    return undefined;
}

export function createEntity(): string {
    const ent = entityManager.create(makeID("E"));
    global.log("Entity created (ID: " + ent.id + ")");
    return ent.id;
}

export function getEntity(id: string): Entity {
    return entityManager.get(id);
}

export function deleteEntity(id: string) {
    entityManager.queueForDeletion(id);
    global.log("Entity queued for deletion (ID: " + id + ")");
}

export function createComponent(entID: string, className: string, localID: string, ...params: any[]) {
    const classToCreate = classList.get(className);
    const entity = entityManager.get(entID);
    if (entity !== undefined) {
        const component = componentManager.create(makeID("C"), classToCreate, entity, localID, ...params);
        entity.add(localID, component);
        global.log(
            "Component created (Entity ID: "
            + entID
            + ", Component Local ID: "
            + localID
            + ", Params: "
            + JSON.stringify(params)
            +  ")");
    }
}

export function deleteComponent(componentID: string) {
    entityManager.queueForDeletion(componentID);
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

export function handleInput(entityID: string, input: string, state: InputType) {
    if (!entityManager.has(entityID)) {
        return;
    }
    const entity = entityManager.get(entityID);
    if (entity !== undefined) {
        const component = entity.get("control");
        if (component instanceof Control) {
            switch (state) {
                case InputType.Press: {
                    if (typeof component.sendKeyPress === "function") {
                        component.sendKeyPress(input);
                    }
                    break;
                }
                case InputType.Release: {
                    if (typeof component.sendKeyRelease === "function") {
                        component.sendKeyRelease(input);
                    }
                    break;
                }
            }
        }
    }
}

export function setComponentClass(classObj: IClassInterface, id: string) {
    if (classObj.prototype instanceof Component) {
        // TODO: If a component class already exists on upload, re-instantiate instances of it with the new version
        classList.set(id, classObj);
    }
}

export function watchEntity(playerID: string, entityID?: string) {
    if (entityID === undefined) {
        watchedEntities.delete("" + playerID);
    }
    else {
        watchedEntities.set("" + playerID, entityID);
    }
    // TODO: Replace all number IDs with strings
    // TODO: Fix the compiler freaking out about things in __scripted__
}

const resetExports = () => {
    exportValues.entities = {};
    exportValues.watchedEntityInfo = {};
};

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
