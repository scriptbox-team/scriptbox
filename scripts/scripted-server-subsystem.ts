import ActionInstance from "./action-instance";
import Aspect from "./aspect";
import Chat from "./chat";
import CollisionBox from "./collision-box";
import CollisionDetector from "./collision-detector";
import Component from "./component";
import ComponentInfo, { ComponentInfoProxy } from "./component-info";
import Control from "./control";
import DefaultControl from "./default-control";
import DirectionFlipper from "./direction-flipper";
import Display from "./display";
import Entity, { EntityProxy } from "./entity";
import Exports, { ComponentExportInfo, EntityExportInfo, MessageExportInfo } from "./export-values";
import IDGenerator from "./id-generator";
import Manager from "./manager";
import Map from "./map";
import MetaInfo from "./meta-info";
import ObjectSerializer from "./object-serializer";
import Player, { PlayerProxy } from "./player";
import PlayerSoul from "./player-soul";
import Position from "./position";
import ProxyGenerator from "./proxy-generator";
import Resource from "./resource";
import SerializedObjectCollection from "./serialized-object-collection";
import Set from "./set";
import SoundEmitter from "./sound-emitter";
import WeakMap from "./weak-map";

//tslint:disable
type ClassInterface = {new (...args: any[]): any};
// tslint:enable

const idGenerator = new IDGenerator(Math.random());

const makeID = (prefix: string) => {
    return idGenerator.makeFrom(prefix, Date.now(), Math.random());
};

const exportValues: Exports = {
    entities: {},
    sprites: {},
    inspectedEntityInfo: {},
    players: {},
    messages: [],
    sounds: {}
};

global.exportValues = exportValues;

const serializedMap = {serializedData: {} as any};
global.serializedMap = serializedMap;

let messageQueue: MessageExportInfo[] = [];
const playerResources = new Map<string, Map<string, Resource>>();

let executingUser: PlayerProxy | undefined;

const classList = new Map<string, ClassInterface>();
const classPrototypeLookup = new WeakMap<ClassInterface, string>();
let tickRate!: number;

const collisionDetector = new CollisionDetector();

const playerSoulMap = new WeakMap<Player, PlayerSoul>();
const playerUnproxiedMap = new WeakMap<PlayerProxy, Player>();
const playerManager = new Manager<PlayerProxy>((
        id: string,
        username: string,
        displayName: string,
        controlSet: {[id: number]: string},
        controllingEntity?: EntityProxy) => {
    const soul = new PlayerSoul(0, 0);
    const player = new Player(id, username, displayName, controlSet, soul, controllingEntity);
    player.trueEntityFromEntity = (entity: EntityProxy) => entityUnproxiedMap.get(entity);
    const proxy = ProxyGenerator.makeDeletable(
        player,
        Player.readOnlyProps,
        Player.hiddenProps
    );
    player.proxy = proxy;
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
        creator
    );
    const entity = new Entity(id, {
        delete: deleteEntity,
        add: createComponent,
        remove: (entID: string, component: Component) => {
            const componentInfo = componentInfoMap.get(component);
            if (componentInfo.entity === entityManager.get(entID)) {
                deleteComponent(componentInfo.id);
            }
        }
    }, info);
    const proxy = ProxyGenerator.makeDeletable<EntityProxy>(
        entity as any as EntityProxy,
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
    trueEntity.onDelete();
    trueEntity.exists = false;
});

const componentInfoMap = new WeakMap<Component, ComponentInfo>();
const componentInfoUnproxiedMap = new WeakMap<ComponentInfoProxy, ComponentInfo>();
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
            creator
        );
        // TODO: Throw an error if a component doesn't actually extend component
        const infoProxy = ProxyGenerator.make<ComponentInfoProxy>(
            info,
            ["id", "entity", "exists"],
            ["_enabled"]
        );

        let component: any;
        try {
            component = new componentClass(infoProxy);
            componentInfoMap.set(component, info);
            componentInfoUnproxiedMap.set(infoProxy, info);

            const trueEntity = entityUnproxiedMap.get(entity);
            trueEntity.directAdd(localID, component);
            componentExecute(component, "onCreate", ...args);
            componentExecute(component, "onLoad", ...args);
        }
        catch (err) {
            if (component !== undefined) {
                handleComponentError(component, err);
            }
            else {
                outputUserError(creator, err);
                info.forceDisable();
            }
        }

        return component;
    },
    (component: Component) => {
        const info = componentInfoMap.get(component);
        try {
            componentExecute(component, "onDestroy");
            componentExecute(component, "onUnload");
        }
        catch (err) {
            handleComponentError(component, err);
        }
        const trueEntity = entityUnproxiedMap.get(info.entity);
        trueEntity.directRemove(trueEntity.getComponentLocalID(component));
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

function log(...params: any[]) {
    global.log(...params);
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
            global.log(error.stack);
        }
    }
    else {
        global.log(error.stack);
    }
}

function runOnAll(funcName: string, ...args: any[]) {
    const componentIterator = componentManager.entries();
    for (const [key, component] of componentIterator) {
        const info = componentInfoMap.get(component);
        if (info !== undefined && info.enabled) {
            info.lastFrameTime = -1;
            try {
                componentExecute(component, funcName, ...args);
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
    Entity.externalFromID = getEntity;
    Component.externalFromID = (id: string) => {
        return componentManager.get(id);
    };
    Chat.externalSendChatMessage = (msg: string) => {
        messageQueue.push({
            message: msg,
            kind: "chat",
            recipient: Array.from(playerManager.entries()).map(([id, player]) => id)
        });
    };
}

export function update() {
    // For each component, call update function if exists
    runOnAll("onUpdate", 1 / tickRate);
    runOnAll("onPostUpdate", 1 / tickRate);
    playerManager.deleteQueued();
    entityManager.deleteQueued();
    componentManager.deleteQueued();
    // After the update and postupdate are called we should let the exports know about important changes
    resetExports();
    const collisionBoxInfo = [];

    //
    //  Position export updating + collision box gathering
    //
    let entities = entityManager.entries();
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
        const collisionBox = componentInfoMap.get(collisionComponent);
        if (collisionComponent !== undefined && collisionBox.enabled) {
            try {
                const x1 = componentExecuteDirect(collisionBox, () => collisionComponent.x1.getValue());
                const y1 = componentExecuteDirect(collisionBox, () => collisionComponent.y1.getValue());
                const x2 = componentExecuteDirect(collisionBox, () => collisionComponent.x2.getValue());
                const y2 = componentExecuteDirect(collisionBox, () => collisionComponent.y2.getValue());
                const isStatic = componentExecuteDirect(collisionBox, () => collisionComponent.static.getValue());
                const dense = componentExecuteDirect(collisionBox, () => collisionComponent.dense.getValue());
                if (typeof x1 === "number" && typeof y1 === "number"
                && typeof x2 === "number" && typeof y2 === "number"
                && typeof isStatic === "boolean"
                && typeof dense === "boolean"
                && typeof id === "string") {
                    exportValues.entities[id].collisionBox = {
                        x1: Math.min(x1, x2),
                        x2: Math.min(y1, y2),
                        y1: Math.max(x1, x2),
                        y2: Math.max(y1, y2)
                    };
                    const entPos = exportValues.entities[id].position;
                    collisionBoxInfo.push(
                        {
                            id,
                            static: isStatic,
                            dense,
                            bounds: {
                                x1: entPos.x + x1,
                                y1: entPos.y + y1,
                                x2: entPos.x + x2,
                                y2: entPos.y + y2
                            }
                        }
                    );
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

    //
    //  Collision detection and correction
    //
    const collisions = collisionDetector.check(collisionBoxInfo, (obj1, obj2) => {
        const entity1 = entityManager.get(obj1);
        const box1 = entity1.get<CollisionBox>("collision-box");
        const entity2 = entityManager.get(obj2);
        const box2 = entity2.get<CollisionBox>("collision-box");
        let result1 = false;
        let result2 = false;
        try {
            if (typeof box1.canPush === "function") {
                result1 = box1.canPush(entity2);
            }
        }
        catch (err) {
            handleComponentError(box1, err);
        }
        try {
            if (typeof box2.canPush === "function") {
                result2 = box2.canPush(entity1);
            }
        }
        catch (err) {
            handleComponentError(box2, err);
        }

        return result1 && result2;
    });
    const collisionsChecked = new Map<string, Set<string>>();
    for (const collision of collisions) {
        if (!collisionsChecked.has(collision.primaryObj)) {
            collisionsChecked.set(collision.primaryObj, new Set<string>());
        }
        const entity = entityManager.get(collision.primaryObj);
        const positionComponent = entity.get<Position>("position");
        const positionInfo = componentInfoMap.get(positionComponent);
        if (positionComponent !== undefined && positionInfo.enabled) {
            try {
                if (typeof positionComponent.x === "object"
                && typeof positionComponent.y === "object"
                && typeof positionComponent.x.base === "number"
                && typeof positionComponent.y.base === "number"
                ) {
                    positionComponent.x.base += collision.primaryObjNewPos.x;
                    positionComponent.y.base += collision.primaryObjNewPos.y;
                }
                exportValues.entities[collision.primaryObj].position = {
                    x: exportValues.entities[collision.primaryObj].position.x + collision.primaryObjNewPos.x,
                    y: exportValues.entities[collision.primaryObj].position.y + collision.primaryObjNewPos.y
                };
            }
            catch (err) {
                handleComponentError(positionComponent, err);
            }
        }
        for (const other of collision.secondaryObjs) {
            if (!collisionsChecked.has(other.id)) {
                collisionsChecked.set(other.id, new Set<string>());
            }

            if (!collisionsChecked.get(collision.primaryObj).has(other.id)
                    && !collisionsChecked.get(other.id).has(collision.primaryObj)) {
                collisionsChecked.get(collision.primaryObj).add(other.id);
                const otherEntity = entityManager.get(other.id);
                const componentIterator = entity.componentIterator();
                for (const component of componentIterator) {
                    const info = componentInfoMap.get(component);
                    if (info !== undefined && info.enabled) {
                        info.lastFrameTime = -1;
                        try {
                            componentExecute(component, "onCollision", otherEntity, other.dense, other.direction);
                        }
                        catch (err) {
                            handleComponentError(component, err);
                        }
                    }
                }
                const otherComponentIterator = otherEntity.componentIterator();
                for (const component of otherComponentIterator) {
                    const info = componentInfoMap.get(component);
                    if (info !== undefined && info.enabled) {
                        info.lastFrameTime = -1;
                        try {
                            componentExecute(
                                component,
                                "onCollision",
                                entity,
                                other.dense,
                                DirectionFlipper.flip(other.direction)
                            );
                        }
                        catch (err) {
                            handleComponentError(component, err);
                        }
                    }
                }
            }
        }
    }

    //
    //  Display object gathering
    //
    // We need a new iterator since we reached the end of the last one
    entities = entityManager.entries();
    for (const [id, entity] of entities) {
        // TODO: Make it so entities can have multiple displays
        const displayComponent = entity.get<Display>("display");
        const displayInfo = componentInfoMap.get(displayComponent);
        if (displayComponent !== undefined && displayInfo.enabled) {
            try {
                const componentID = displayInfo.id;
                const texture = componentExecuteDirect(displayInfo, () => displayComponent.textureID.getValue());
                const texX = componentExecuteDirect(displayInfo, () => displayComponent.textureX.getValue());
                const texY = componentExecuteDirect(displayInfo, () => displayComponent.textureY.getValue());
                const texWidth = componentExecuteDirect(displayInfo, () => displayComponent.textureWidth.getValue());
                const texHeight = componentExecuteDirect(displayInfo, () => displayComponent.textureHeight.getValue());
                const depth = componentExecuteDirect(displayInfo, () => displayComponent.depth.getValue());
                const xOffset = componentExecuteDirect(displayInfo, () => displayComponent.xOffset.getValue());
                const yOffset = componentExecuteDirect(displayInfo, () => displayComponent.yOffset.getValue());
                const entPosition = exportValues.entities[id].position;
                if (typeof texX === "number" && typeof texY === "number"
                    && typeof texWidth === "number" && typeof texHeight === "number"
                    && typeof depth === "number" && typeof xOffset === "number"
                    && typeof yOffset === "number" && typeof texture === "string"
                    && typeof id === "string"
                    && entPosition !== undefined) {
                    exportValues.sprites[componentID] = {
                        ownerID: id,
                        texture,
                        depth,
                        textureSubregion: {x: texX, y: texY, width: texWidth, height: texHeight},
                        position: {x: entPosition.x + xOffset, y: entPosition.y + yOffset}
                    };
                }
            }
            catch (err) {
                handleComponentError(displayComponent, err);
            }
        }
        const soundEmitterComponent = entity.get<SoundEmitter>("sound-emitter");
        const soundEmitterInfo = componentInfoMap.get(soundEmitterComponent);
        if (soundEmitterComponent !== undefined && soundEmitterInfo.enabled) {
            try {
                if (Array.isArray(soundEmitterComponent.soundQueue)) {
                    const entPosition = exportValues.entities[id].position;
                    for (const elem of soundEmitterComponent.soundQueue) {
                        if (typeof elem === "object"
                                && typeof elem.resource === "string"
                                && typeof elem.volume === "number") {
                            exportValues.sounds[soundEmitterInfo.id] = {
                                position: {
                                    x: entPosition.x,
                                    y: entPosition.y
                                },
                                resource: elem.resource,
                                volume: elem.volume
                            };
                        }
                        soundEmitterComponent.soundQueue = [];
                    }
                }
            }
            catch (err) {
                handleComponentError(soundEmitterComponent, err);
            }
        }
    }
    // Retrieve entity inspection information
    const playersInspecting = inspectedEntities.keys();
    for (const player of playersInspecting) {
        const entityID = inspectedEntities.get(player);
        if (!entityManager.has(entityID)) {
            exportValues.inspectedEntityInfo[player] = {
                id: entityID,
                name: "<UNKNOWN>",
                componentInfo: {}
            };
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
        const purePlayer = playerUnproxiedMap.get(player);
        if (player.controllingEntity === undefined) {
            const playerSoul = playerSoulMap.get(purePlayer);
            playerSoul.move(1 / tickRate);
            const soulAnimFrame = Math.floor(Date.now() / 100) % 4;
            const soulAnimSet = playerSoul.getAnimFrame();
            exportValues.sprites[playerID] = {
                ownerID: undefined,
                texture: "R000000000000000000000001",
                depth: 99,
                textureSubregion: {
                    x: soulAnimFrame * 32 + soulAnimSet * 128,
                    y: 0,
                    width: 32,
                    height: 32
                },
                position: {x: playerSoul.position.x - 16, y: playerSoul.position.y - 16}
            };
            purePlayer.camera.x.base = playerSoul.position.x + 16;
            purePlayer.camera.y.base = playerSoul.position.y + 16;
        }
        else {
            const id = player.controllingEntity.id;
            purePlayer.camera.x.base = exportValues.entities[id].position.x + 16;
            purePlayer.camera.y.base = exportValues.entities[id].position.y + 16;
        }
        exportValues.players[playerID] = {camera: {
            x: purePlayer.camera.x.getValue(),
            y: purePlayer.camera.y.getValue(),
            scale: purePlayer.camera.scale.getValue()
        }};
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

const _deleteEntity = (id: string) => {
    entityManager.queueForDeletion(id);
    global.log("Entity queued for deletion (ID: " + id + ")");
};

export function deleteEntity(id: string) {
    return _deleteEntity(id);
}

const _createComponent = (
    entID: string,
    classID: string,
    localID: string,
    creatorID?: string,
    ...params: any[]) => {
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
        return component.id;
    }
    return undefined;
};

export function createComponent(
    entID: string,
    classID: string,
    localID: string,
    creatorID?: string,
    ...params: any[]) {
    return _createComponent(entID, classID, localID, creatorID, ...params);
}

const _deleteComponent = (componentID: string) => {
    componentManager.queueForDeletion(componentID);
    global.log("Component queued for deletion (ID: " + componentID + ")");
};

export function deleteComponent(componentID: string) {
    return _deleteComponent(componentID);
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

export function setComponentClass(classObj: ClassInterface, id: string, overwrite: boolean = true) {
    if (classObj !== undefined) {
        if (overwrite || !classList.has(id)) {
            classList.set(id, classObj);
            classPrototypeLookup.set(classObj.prototype, id);
        }
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
        39: "right",
        90: "action1"
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

export function setResourceList(playerUsername: string, resources: Resource[]) {
    const resourceMap = new Map<string, Resource>();
    for (const resource of resources) {
        resourceMap.set(resource.id, resource);
    }
    playerResources.set(playerUsername, resourceMap);
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

interface GameObjectCollection extends SerializedObjectCollection {
    entityReferences: Array<{
        entID: string;
        parentID: number;
        name: string;
    }>;
    playerReferences: Array<{
        playerID: string;
        parentID: number;
        name: string;
    }>;
    componentInfoReferences: Array<{
        componentID: string;
        parentID: number;
        name: string;
    }>;
}

interface SerializedObject {
    module?: string;
    object: any;
    componentID?: string;
}

export function serializeGameState() {
    // Get all of the pure entities
    const pureEntities = Array.from(entityManager.entries()).map(([id, entity]) => entityUnproxiedMap.get(entity));
    const pureComponentData = Array.from(componentManager.entries())
        .map(([id, entity]) => componentInfoMap.get(entity));
    const serializedObj = ObjectSerializer.serialize<GameObjectCollection>(
        classPrototypeLookup,
        (pureEntities as any).concat(pureComponentData),
        (obj) => {
            return entityUnproxiedMap.has(obj)
            || playerUnproxiedMap.has(obj)
            || componentInfoUnproxiedMap.has(obj);
        },
        (collect, parentID, obj, name) => {
            if (collect.entityReferences === undefined) {
                collect.entityReferences = [];
            }
            if (collect.playerReferences === undefined) {
                collect.playerReferences = [];
            }
            if (collect.componentInfoReferences === undefined) {
                collect.componentInfoReferences = [];
            }
            if (entityUnproxiedMap.has(obj)) {
                collect.entityReferences.push({
                    entID: entityUnproxiedMap.get(obj).id,
                    parentID,
                    name
                });
            }
            else if (playerUnproxiedMap.has(obj)) {
                collect.playerReferences.push({
                    playerID: playerUnproxiedMap.get(obj).id,
                    parentID,
                    name
                });
            }
            else if (componentInfoUnproxiedMap.has(obj)) {
                collect.componentInfoReferences.push({
                    componentID: componentInfoUnproxiedMap.get(obj).id,
                    parentID,
                    name
                });
            }
        },
        (obj) => {
            if (componentInfoMap.has(obj)) {
                return componentInfoMap.get(obj).id;
            }
            return undefined;
        }
    ) as GameObjectCollection;
    serializedMap.serializedData = serializedObj;
}

export function deserializeGameState(gameState: GameObjectCollection) {
    const maps = [] as number[];
    const componentInfoList = [] as ComponentInfo[];
    const componentProxies = new Map<string, ComponentInfoProxy>();
    const revivedObjects = ObjectSerializer.deserialize(classList, gameState, (id: number, data: SerializedObject) => {
        switch (data.module) {
            case "entity": {
                const entity = entityManager.create(data.object._id);
                const pureEntity = entityUnproxiedMap.get(entity);
                Object.assign(pureEntity, data.object);
                return pureEntity;
            }
            case "component-info": {
                const componentInfo = new ComponentInfo(
                    data.object.id,
                    data.object.entity,
                    data.object.name,
                    data.object.description,
                    data.object._enabled,
                    data.object.exists,
                    data.object.owner
                );
                Object.assign(componentInfo, data.object);
                const infoProxy = ProxyGenerator.make<ComponentInfoProxy>(
                    componentInfo,
                    ["id", "entity", "exists"],
                    ["_enabled"]
                );
                componentProxies.set(data.object.id, infoProxy);
                componentInfoUnproxiedMap.set(infoProxy, componentInfo);
                componentInfoList.push(componentInfo);
                return componentInfo;
            }
            case "player": {
                // Do nothing with players being loaded in
                return undefined;
            }
            case "map": {
                maps.push(id);
                return new Map<any, any>();
            }
            case "set": {
                const arr = Object.keys(data.object).reduce((acc, key) => {
                    acc.push(data.object[key]);
                    return acc;
                }, [] as any[]);
                return new Set<any>(arr);
            }
            case "array": {
                return Object.assign([], data.object);
            }
            default: {
                let revivedObj = {} as any;
                if (data.module !== undefined && classList.has(data.module)) {
                    revivedObj = new (classList.get(data.module))();
                }
                if (data.componentID !== undefined) {
                    componentManager.add(data.componentID, revivedObj);
                }
                return Object.assign(revivedObj, data.object);
            }
        }
    });
    // Put component info in the manager
    for (const componentInfo of componentInfoList) {
        const component = componentManager.get(componentInfo.id);
        if (component !== undefined) {
            componentInfoMap.set(component, componentInfo);
        }
    }
    // Fix references
    for (const ref of gameState.entityReferences) {
        if (revivedObjects[ref.parentID] instanceof Set) {
            revivedObjects[ref.parentID].add(entityManager.get(ref.entID));
        }
        else {
            revivedObjects[ref.parentID][ref.name] = entityManager.get(ref.entID);
        }
    }
    for (const ref of gameState.componentInfoReferences) {
        if (revivedObjects[ref.parentID] instanceof Set) {
            revivedObjects[ref.parentID].add(componentProxies.get(ref.componentID));
        }
        else {
            revivedObjects[ref.parentID][ref.name] = componentProxies.get(ref.componentID);
        }
    }
    // Handle maps
    for (const mapID of maps) {
        const map = revivedObjects[mapID];
        const refs = gameState.references.filter((ref) => ref.parentID === mapID);
        for (const ref of refs) {
            const arr = revivedObjects[ref.objID];
            map.set(arr[0], arr[1]);
        }
    }

    // Finally reload all entities
    const entities = entityManager.entries();
    for (const [id, e] of entities) {
        e.reload();
    }
}

const resetExports = () => {
    exportValues.entities = {};
    exportValues.inspectedEntityInfo = {};
    exportValues.sprites = {};
    exportValues.players = {};
    exportValues.messages = [];
    exportValues.sounds = {};
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
