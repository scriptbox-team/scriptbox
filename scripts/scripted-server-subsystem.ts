import Aspect from "./aspect";
import CollisionBox from "./collision-box";
import Component from "./component";
import ComponentInfo, { IComponentInfoProxy } from "./component-info";
import Control from "./control";
import DefaultControl from "./default-control";
import Entity, { IEntityProxy } from "./entity";
import IDGenerator from "./id-generator";
import Manager from "./manager";
import MetaInfo from "./meta-info";
import Player, { IPlayerProxy } from "./player";
import PlayerSoul from "./player-soul";
import Position from "./position";
import ProxyGenerator from "./proxy-generator";
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
    inspectedEntityInfo: {[playerID: string]: IEntityInfo};
}

const exportValues: IExports = {
    entities: {},
    inspectedEntityInfo: {}
};

global.exportValues = exportValues;

const classList = new Map<string, IClassInterface>();

const playerSoulMap = new WeakMap<Player, PlayerSoul>();
const playerProxyMap = new WeakMap<Player, IPlayerProxy>();
const playerManager = new Manager<Player>((
        id: string,
        username: string,
        displayName: string,
        controlSet: {[id: number]: string},
        controllingEntity?: Entity) => {
    const soul = new PlayerSoul(0, 0);
    const player = new Player(id, username, displayName, controlSet, soul, controllingEntity);
    const proxy = ProxyGenerator.makeDeletable(
        player,
        Player.readOnlyProps,
        Player.hiddenProps
    );
    playerSoulMap.set(player, soul);
    playerProxyMap.set(player, proxy);
    return player;
},
(player: Player) => {
    player.unpossess();
    player.exists = false;
});

const entityProxyMap = new WeakMap<Entity, IEntityProxy>();
const entityManager = new Manager<Entity>((id: string, creator: Player) => {
    const info = new MetaInfo(
        `Entity ${id}`,
        "",
        true,
        true,
        [],
        creator
    );
    const entity = new Entity(id, info);
    const proxy = ProxyGenerator.makeDeletable<IEntityProxy>(
        entity,
        Entity.hiddenProps,
        Entity.readOnlyProps
    );
    entityProxyMap.set(entity, proxy);
    return entity;
},
(entity: Entity) => {
    if (entity.controller) {
        entity.controller.unpossess();
    }
    entity.delete();
    entity.exists = false;
});

const componentInfoMap = new WeakMap<Component, ComponentInfo>();
const componentProxyMap = new WeakMap<Component, Component>();
const componentManager = new Manager<Component>((
            componentID: string,
            componentClass: IClassInterface,
            entity: Entity,
            localID: string,
            creator: Player,
            ...args: any[]) => {
        const info = new ComponentInfo(
            componentID,
            entity,
            localID,
            "",
            true,
            true,
            [],
            creator
        );
        // TODO: Throw an error if a component doesn't actually extend component
        const infoProxy = ProxyGenerator.make<IComponentInfoProxy>(
            info,
            ["id", "entity", "exists"],
            ["_enabled", "_tags"]
        );
        const component = new componentClass(infoProxy);
        const proxy = ProxyGenerator.makeDeletable(
            component,
            [],
            [],
            (checkedComponent: Component) => {
                return componentInfoMap.get(checkedComponent).exists;
            }
        );
        componentInfoMap.set(component, info);
        componentProxyMap.set(component, proxy);

        if (typeof component.create === "function") {
            component.create(...args);
        }

        return component;
    },
    (component: Component) => {
        if (typeof (component as any).delete === "function") {
            (component as any).delete();
        }
        const info = componentInfoMap.get(component);
        info.entity.remove(info.entity.getComponentLocalID(component));
    }
);

const inspectedEntities: Map<string, string> = new Map<string, string>();

// TODO: Reconsider all places that use Object.keys (can have undefined values)

function runOnAll(funcName: string) {
    const componentIterator = componentManager.entries();
    for (const [, component] of componentIterator) {
        try {
            if (funcName in component && typeof (component as any)[funcName] === "function") {
                (component as any)[funcName]();
            }
        }
        catch (err) {
            if (component instanceof Component) {
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
    playerManager.deleteQueued();
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
    // Retrieve entity inspection information
    const playersInspecting = inspectedEntities.keys();
    for (const player of playersInspecting) {
        const entityID = inspectedEntities.get(player);
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
        exportValues.inspectedEntityInfo[player] = entityInfo;
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

export function call(entID: string, funcName: string, ...args: any[]) {
    // Call a function on a component if it exists
    const entity = entityManager.get(entID);
    if (entity !== undefined) {
        const component = entity.get(entID);
        if (component !== null && funcName in component && typeof (component as any)[funcName] === "function") {
            return (component as any)[funcName](...args);
        }
    }
}

export function get(entID: string, propName: string) {
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
    componentManager.queueForDeletion(componentID);
    global.log("Component queued for deletion (ID: " + componentID + ")");
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

export function handleInput(playerID: string, input: number, state: InputType) {
    const player = playerManager.get(playerID);
    if (player !== undefined) {
        const entity = player.controllingEntity;
        if (entity !== undefined) {
            const component = entity.get("control");
            if (component instanceof Control) {
                switch (state) {
                    case InputType.Press: {
                        if (typeof component.sendKeyPress === "function") {
                            component.sendKeyPress(player.controlSet["" + input]);
                        }
                        break;
                    }
                    case InputType.Release: {
                        if (typeof component.sendKeyRelease === "function") {
                            component.sendKeyRelease(player.controlSet["" + input]);
                        }
                        break;
                    }
                }
            }
        }
        else {
            // Soul mode
            const inputName = player.controlSet["" + input];
            const soul = playerSoulMap.get(player);
            switch (inputName) {
                case "up":
                    soul.keyInput("up", state === InputType.Press);
                    break;
                case "down":
                    soul.keyInput("down", state === InputType.Press);
                    break;
                case "left":
                    soul.keyInput("left", state === InputType.Press);
                    break;
                case "right":
                    soul.keyInput("right", state === InputType.Press);
                    break;
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

export function inspectEntity(playerID: string, entityID?: string) {
    if (entityID === undefined) {
        inspectedEntities.delete("" + playerID);
    }
    else {
        inspectedEntities.set("" + playerID, entityID);
    }
    // TODO: Replace all number IDs with strings
    // TODO: Fix the compiler freaking out about things in __scripted__
}

export function createPlayer(
        id: string,
        username: string,
        displayName: string) {
    const controlSet = {
        38: "up",
        40: "down",
        37: "left",
        39: "right"
    };
    playerManager.create(id, username, displayName, controlSet);
}

export function deletePlayer(id: string) {
    playerManager.queueForDeletion(id);
}

export function renamePlayer(id: string, displayName: string) {
    const player = playerManager.get(id);
    if (player !== undefined) {
        player.displayName = displayName;
    }
}

export function setPlayerControllingEntity(id: string, entityID?: string) {
    const player = playerManager.get(id);
    const entity = entityID !== undefined ? entityManager.get(entityID): undefined;
    if (player !== undefined) {
        player.possess(entity);
    }
}

const resetExports = () => {
    exportValues.entities = {};
    exportValues.inspectedEntityInfo = {};
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

classList.set("position", Position);
classList.set("velocity", Velocity);
classList.set("collision-box", CollisionBox);
classList.set("default-control", DefaultControl);
