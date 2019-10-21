import Aspect from "./aspect";
import CollisionBox from "./collision-box";
import Component from "./component";
import ComponentInfo, { ComponentInfoProxy } from "./component-info";
import Control from "./control";
import DefaultControl from "./default-control";
import Entity, { EntityProxy } from "./entity";
import Exports, { ComponentExportInfo, EntityExportInfo, MessageExportInfo } from "./export-values";
import IDGenerator from "./id-generator";
import Manager from "./manager";
import MetaInfo from "./meta-info";
import Player, { PlayerProxy } from "./player";
import PlayerSoul from "./player-soul";
import Position from "./position";
import ProxyGenerator from "./proxy-generator";
import Velocity from "./velocity";

//tslint:disable
type ClassInterface = {new (...args: any[]): any};
// tslint:enable

const idGenerator = new IDGenerator(Math.random());

const makeID = (prefix: string) => {
    return idGenerator.makeFrom(prefix, Date.now(), Math.random());
};

const exportValues: Exports = {
    entities: {},
    inspectedEntityInfo: {},
    messages: []
};

global.exportValues = exportValues;

let messageQueue: MessageExportInfo[] = [];
let executingUser: PlayerProxy | undefined;

const classList = new Map<string, ClassInterface>();
let tickRate!: number;

const playerSoulMap = new WeakMap<Player, PlayerSoul>();
const playerUnproxiedMap = new WeakMap<PlayerProxy, Player>();
const playerManager = new Manager<PlayerProxy>((
        id: string,
        username: string,
        displayName: string,
        controlSet: {[id: number]: string},
        controllingEntity?: Entity) => {
    const soul = new PlayerSoul(0, 0);
    const player = new Player(id, username, displayName, controlSet, soul, controllingEntity);
    player.trueEntityFromEntity = (entity: EntityProxy) => entityUnproxiedMap.get(entity);
    const proxy = ProxyGenerator.makeDeletable(
        player,
        Player.readOnlyProps,
        Player.hiddenProps
    );
    playerSoulMap.set(player, soul);
    playerUnproxiedMap.set(proxy, player);
    return proxy;
},
(player: PlayerProxy) => {
    inspectEntity(player.id, undefined);
    const truePlayer = playerUnproxiedMap.get(player);
    truePlayer.release();
    truePlayer.exists = false;
});

const entityUnproxiedMap = new WeakMap<EntityProxy, Entity>();
const entityManager = new Manager<EntityProxy>((id: string, creator: Player) => {
    const info = new MetaInfo(
        `Entity ${id}`,
        "",
        true,
        true,
        [],
        creator
    );
    const entity = new Entity(id, {
        delete: deleteEntity,
        add: createComponent,
        remove: deleteComponent,
    }, info);
    const proxy = ProxyGenerator.makeDeletable<EntityProxy>(
        entity,
        Entity.hiddenProps,
        Entity.readOnlyProps
    );
    entityUnproxiedMap.set(proxy, entity);
    return proxy;
},
(entity: EntityProxy) => {
    const trueEntity = entityUnproxiedMap.get(entity);
    if (trueEntity.controller) {
        trueEntity.controller.release();
    }
    trueEntity.delete();
    trueEntity.exists = false;
});

const componentInfoMap = new WeakMap<Component, ComponentInfo>();
const componentManager = new Manager<Component>((
            componentID: string,
            componentClass: ClassInterface,
            entity: EntityProxy,
            localID: string,
            creator?: Player,
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
        const infoProxy = ProxyGenerator.make<ComponentInfoProxy>(
            info,
            ["id", "entity", "exists"],
            ["_enabled", "_tags"]
        );
        const component = new componentClass(infoProxy);
        componentInfoMap.set(component, info);

        componentExecute(component, "create", ...args);
        const trueEntity = entityUnproxiedMap.get(entity);
        trueEntity.directAdd(localID, component);

        return component;
    },
    (component: Component) => {
        const info = componentInfoMap.get(component);
        componentExecute(component, "delete");
        const trueEntity = entityUnproxiedMap.get(info.entity);
        trueEntity.directRemove(info.entity.getComponentLocalID(component));
    }
);

const inspectedEntities: Map<string, string> = new Map<string, string>();

// TODO: Reconsider all places that use Object.keys (can have undefined values)

function componentExecute(component: any, funcName: string, ...args: any[]) {
    if (typeof component[funcName] === "function") {
        const info = componentInfoMap.get(component);
        return componentExecuteDirect(info, (...a) => component[funcName](...a), ...args);
    }
    return undefined;
}

function componentExecuteDirect<T>(info: ComponentInfo, func: (...a: any[]) => T, ...args: any[]): T {
    executingUser = info.owner;
    info.lastFrameTime = -1;
    let result: any;
    info.lastFrameTime = looseProfile(() => {result = func(...args); });
    executingUser = undefined;
    return result;
}

function outputUserError(owner: PlayerProxy, error: Error) {
    // TODO: Error.prepareStackTrace to improve how user stack traces look
    if (owner !== undefined) {
        messageQueue.push({
            message: `<${error.stack}>`,
            kind: "error",
            recipient: [owner.id]
        });
    }
    else {
        global.log(`<${error.stack}>`);
    }
}

function handleComponentError(component: Component, error: Error) {
    const info = componentInfoMap.get(component);
    if (info !== undefined) {
        const owner = info.owner;
        if (owner !== undefined) {
            outputUserError(owner, error);
            info.forceDisable();
            messageQueue.push({
                // tslint:disable-next-line: max-line-length
                message: `The affected component (${info.id}) has been disabled. Please re-enable the component after fixing the problem.`,
                kind: "error-status",
                recipient: [owner.id]
            });
        }
        else {
            global.log(error);
        }
    }
    else {
        global.log(error);
    }
}

function runOnAll(funcName: string) {
    const componentIterator = componentManager.entries();
    for (const [key, component] of componentIterator) {
        const info = componentInfoMap.get(component);
        if (info !== undefined && info.enabled) {
            info.lastFrameTime = -1;
            try {
                componentExecute(component, funcName);
            }
            catch (err) {
                handleComponentError(component, err);
            }
        }
    }
}

export function initialize(initTickRate: number) {
    tickRate = initTickRate;
    Entity.externalCreate = createEntity;
    Entity.externalGetByID = getEntity;
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
        // TODO: If position is disabled, default to the last known position if it exists
        // Also do this with the rendering stuff
        const positionComponent = entity.get<Position>("position");
        const positionInfo = componentInfoMap.get(positionComponent);
        if (positionComponent !== undefined && positionInfo.enabled) {
            try {
                if (typeof positionComponent.x === "object"
                && typeof positionComponent.y === "object"
                && typeof positionComponent.x.getValue === "function"
                && typeof positionComponent.y.getValue === "function"
                ) {
                    const x = componentExecuteDirect(positionInfo, () => positionComponent.x.getValue());
                    const y = componentExecuteDirect(positionInfo, () => positionComponent.y.getValue());
                    if (typeof x === "number" && typeof y === "number" && typeof id === "string") {
                        exportValues.entities[id].position = {x, y};
                    }
                }
            }
            catch (err) {
                handleComponentError(positionComponent, err);
            }
        }
        // Retrieve collision box info
        const collisionComponent = entity.get<CollisionBox>("collision-box");
        const collisionInfo = componentInfoMap.get(collisionComponent);
        if (collisionComponent !== undefined && collisionInfo.enabled) {
            try {
                if (typeof collisionComponent.x1 === "object"
                && typeof collisionComponent.y1 === "object"
                && typeof collisionComponent.x1.getValue === "function"
                && typeof collisionComponent.y1.getValue === "function"
                && typeof collisionComponent.x2 === "object"
                && typeof collisionComponent.y2 === "object"
                && typeof collisionComponent.x2.getValue === "function"
                && typeof collisionComponent.y2.getValue === "function"
                ) {
                    const x1 = componentExecuteDirect(collisionInfo, () => collisionComponent.x1.getValue());
                    const y1 = componentExecuteDirect(collisionInfo, () => collisionComponent.y1.getValue());
                    const x2 = componentExecuteDirect(collisionInfo, () => collisionComponent.x2.getValue());
                    const y2 = componentExecuteDirect(collisionInfo, () => collisionComponent.y2.getValue());
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
            catch (err) {
                handleComponentError(collisionComponent, err);
            }
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
        const componentInfo = components.reduce((acc, component) => {
            acc[component.localID] = getComponentInfo(component);
            return acc;
        }, {});
        const entityInfo: EntityExportInfo = {
            id: entityID,
            name: "Entity " + entityID, // temporary
            componentInfo,
            controlledBy: entity.controller !== undefined ? entity.controller.id : undefined
        };
        exportValues.inspectedEntityInfo[player] = entityInfo;
    }

    const playerIterator = playerManager.entries();
    for (const [playerID, player] of playerIterator) {
        if (player.controllingEntity === undefined) {
            const purePlayer = playerUnproxiedMap.get(player);
            const playerSoul = playerSoulMap.get(purePlayer);
        }
    }
    exportValues.messages = messageQueue;
    messageQueue = [];
}

function getComponentInfo(component: Component): ComponentExportInfo {
    const keys = Object.keys(component);
    const info = componentInfoMap.get(component);
    // TODO: Make it so that circular types can be serialized in some way
    // Maybe use the prefab serialization method?
    const attributes = keys
        .filter(((key) => key.substr(0, 1) !== "_"))
        .map((key) => {
            let value = component[key];
            if (typeof value === "object" && typeof value.displayData === "object") {
                value = value.displayData;
            }
            return {
                name: key,
                kind: typeof value,
                value: JSON.stringify(value)
            };
        });
    return {
        id: info.id,
        name: info.name,
        enabled: info.enabled,
        lastFrameTime: info.lastFrameTime,
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

export function createEntity(creatorID?: string): string {
    const creator = creatorID !== undefined ? playerManager.get(creatorID) : undefined;
    const ent = entityManager.create(makeID("E"), creator);
    global.log("Entity created (ID: " + ent.id + ")");
    return ent.id;
}

const _getEntity = (id: string): EntityProxy => {
    return entityManager.get(id);
};

export function getEntity(id: string) {
    return _getEntity(id);
}

export function deleteEntity(id: string) {
    entityManager.queueForDeletion(id);
    global.log("Entity queued for deletion (ID: " + id + ")");
}

export function createComponent(
        entID: string,
        classID: string,
        localID: string,
        creatorID?: string,
        ...params: any[]) {
    const classToCreate = classList.get(classID);
    const entity = entityManager.get(entID);
    const creator = creatorID !== undefined ? playerManager.get(creatorID) : undefined;
    if (entity !== undefined) {
        const component = componentManager.create(makeID("C"), classToCreate, entity, localID, creator, ...params);
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

export function create(classParam: string | ClassInterface, ...args: any[]) {
    let classToCreate: ClassInterface;
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
            if (component !== undefined) {
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
            const truePlayer = playerUnproxiedMap.get(player);
            const soul = playerSoulMap.get(truePlayer);
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

export function setComponentClass(classObj: ClassInterface, id: string) {
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
    // TODO: Fix the compiler freaking out about things in scripts
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
    global.log(
        "Player created (ID: "
        + id
        + ", Username: "
        + username
        + ", Display Name: "
        + displayName
        +  ")");
}

export function deletePlayer(id: string) {
    playerManager.queueForDeletion(id);
}

export function getPlayer(id: string) {
    return playerManager.get(id);
}

export function renamePlayer(id: string, displayName: string) {
    const player = playerManager.get(id);
    if (player !== undefined) {
        player.displayName = displayName;
    }
}

export function setPlayerControllingEntity(id: string, entityID?: string) {
    const player = playerManager.get(id);
    const entity = entityID !== undefined ? entityManager.get(entityID) : undefined;
    if (player !== undefined) {
        if (entityID !== undefined) {
            player.control(entity);
        }
        else {
            player.release();
        }
    }
}

export function getPlayerControllingEntity(id: string) {
    const player = playerManager.get(id);
    return player.controllingEntity !== undefined ? player.controllingEntity.id : undefined;
}

export function setComponentEnableState(componentID: string, state: boolean) {
    const component = componentManager.get(componentID);
    if (component !== undefined) {
        const info = componentInfoMap.get(component);
        if (state) {
            info.manualEnable();
        }
        else {
            info.enabled = false;
        }
    }
}

function looseProfile(func: () => void): number {
    const time = Date.now();
    func();
    return Date.now() - time;
}

export function recoverFromTimeout() {
    const expectedFrameTime = 1 / tickRate;
    const cutoffTime = expectedFrameTime * 0.3;
    let timeAccountedFor = 0;
    const componentIterator = componentManager.entries();
    for (const [componentID, component] of componentIterator) {
        const info = componentInfoMap.get(component);
        const time = info.lastFrameTime;
        // Note: This naively decides to disable just a component that exceeded the frame time
        // Or if it reaches the end, it does the last component that was executing when it timed out
        if (info.enabled) {
            if (time > cutoffTime || time === -1) {
                // tslint:disable-next-line: max-line-length
                const err = new Error(`During global error, max frame time was exceeded (${Math.round(cutoffTime * 1000)}ms)`);
                handleComponentError(component, err);
                return;
            }
            timeAccountedFor += time;
        }
    }
}

const resetExports = () => {
    exportValues.entities = {};
    exportValues.inspectedEntityInfo = {};
    exportValues.messages = [];
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
