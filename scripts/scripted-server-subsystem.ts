import CollisionDetector from "collision-detector";
import QuadtreeGrid from "quadtree-grid";
import Stringifier from "stringifier";

import ActionInstance from "./action-instance";
import Aspect from "./aspect";
import Chat from "./chat";
import CollisionBox from "./collision-box";
import CollisionResolver from "./collision-resolver";
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
import ResourceGetter from "./resource-getter";
import SerializedObjectCollection from "./serialized-object-collection";
import Set from "./set";
import SoundEmitter from "./sound-emitter";
import WeakMap from "./weak-map";
import MapGenerator from "map-generator";
import Random from "random";

interface CollisionBoxInfo {
    id: string;
    bounds: {
        x1: number;
        y1: number;
        x2: number;
        y2: number;
    };
    static: boolean;
    dense: boolean;
}

interface IDBoundingBox {
    id: string;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}

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

const serializedMap = {serializedData: {} as any, generatedSections: {} as {[x: number]: {[y: number]: boolean}}};
global.serializedMap = serializedMap;

const generatedSections: {[x: number]: {[y: number]: boolean}} = {};

let messageQueue: MessageExportInfo[] = [];
const playerResources = new Map<string, Map<string, Resource>>();

let executingUser: PlayerProxy | undefined;

let mapGen: boolean = true;

const classList = new Map<string, ClassInterface>();
const classPrototypeLookup = new WeakMap<ClassInterface, string>();
let tickRate!: number;

const collisionResolver = new CollisionResolver();

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
    ) as PlayerProxy;
    player.proxy = proxy;
    playerSoulMap.set(player, soul);
    playerUnproxiedMap.set(proxy, player);
    return proxy;
},
(player: PlayerProxy) => {
    inspectEntity(player.id, undefined);
    const truePlayer = playerUnproxiedMap.get(player);
    if (truePlayer !== undefined) {
        truePlayer.release();
        truePlayer.exists = false;
    }
});

const entityUnproxiedMap = new WeakMap<EntityProxy, Entity>();
const entityManager = new Manager<EntityProxy>((id: string, creator: PlayerProxy) => {
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
            if (componentInfo !== undefined && componentInfo.entity === entityManager.get(entID)) {
                deleteComponent(componentInfo.id);
            }
        }
    }, info);
    const proxy = ProxyGenerator.makeDeletable<EntityProxy>(
        entity as any as EntityProxy,
        Entity.hiddenProps,
        Entity.readOnlyProps
    );
    trackedEntities.add(id);
    entityUnproxiedMap.set(proxy, entity);
    return proxy;
},
(entity: EntityProxy) => {
    const trueEntity = entityUnproxiedMap.get(entity);
    if (trueEntity !== undefined) {
        if (trueEntity.controller) {
            trueEntity.controller.release();
        }
        trueEntity.onDelete();
        if (trackedEntities.has(trueEntity.id)) {
            trackedEntities.delete(trueEntity.id);
        }
        trueEntity.exists = false;
    }
});

const componentInfoMap = new WeakMap<Component, ComponentInfo>();
const componentInfoUnproxiedMap = new WeakMap<ComponentInfoProxy, ComponentInfo>();
const componentManager = new Manager<Component>((
            componentID: string,
            componentClass: ClassInterface,
            entity: EntityProxy,
            localID: string,
            creator?: PlayerProxy,
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
            if (trueEntity !== undefined) {
                trueEntity.directAdd(localID, component);
            }
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
        if (info !== undefined) {
            try {
                componentExecute(component, "onDestroy");
                componentExecute(component, "onUnload");
            }
            catch (err) {
                handleComponentError(component, err);
            }
            const trueEntity = entityUnproxiedMap.get(info.entity);
            if (trueEntity !== undefined) {
                const localID = trueEntity.getComponentLocalID(component);
                if (localID !== undefined) {
                    trueEntity.directRemove(localID);
                }
            }
        }
    }
);

const inspectedEntities: Map<string, string> = new Map<string, string>();

let collisionBoxInfo: Map<string, CollisionBoxInfo> | undefined;
const trackedEntities = new Set<string>();

let entityTreeGrids: {
    static: QuadtreeGrid<{id: string, x1: number, y1: number, x2: number, y2: number}>,
    dynamic: QuadtreeGrid<{id: string, x1: number, y1: number, x2: number, y2: number}>
}| undefined;

// TODO: Reconsider all places that use Object.keys (can have undefined values)

function componentExecute(component: any, funcName: string, ...args: any[]) {
    if (typeof component[funcName] === "function") {
        const info = componentInfoMap.get(component);
        if (info !== undefined) {
            return componentExecuteDirect(info, (...a) => component[funcName](...a), ...args);
        }
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

function outputUserError(owner: PlayerProxy | undefined, error: Error) {
    // TODO: Error.prepareStackTrace to improve how user stack traces look
    if (owner !== undefined && owner.exists) {
        const trueOwner = playerUnproxiedMap.get(owner);
        if (trueOwner !== undefined) {
            messageQueue.push({
                message: `<${error.stack}>`,
                kind: "error",
                recipient: [trueOwner.id]
            });
        }
    }
    else {
        log(`<${error.stack}>`);
    }
}

function handleComponentError(component: Component, error: Error) {
    const info = componentInfoMap.get(component);
    if (info !== undefined && info.owner !== undefined) {
        const owner = info.owner;
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
        log(error.stack);
    }
}

function runOn(entities: EntityProxy[], funcName: string, ...args: any[]) {
    for (const entity of entities) {
        const components = entity.componentIterator();
        for (const component of components) {
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
}

export function initialize(initTickRate: number) {
    tickRate = initTickRate;
    Entity.externalCreate = createEntity;
    Entity.externalFromID = getEntity;
    ResourceGetter.externalGet = (username, filename) => {
        const playerRes = playerResources.get(username);
        if (playerRes !== undefined) {
            const res = playerRes.get(filename);
            if (res !== undefined) {
                return res.id;
            }
        }
        return undefined;
    };
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

export function generateInitialMap() {
    handleMapGen([{x: 0, y: 0}, {x: -1, y: 0}, {x: -1, y: -1}, {x: 0, y: -1}]);
}

export function setMapGen(value: boolean) {
    mapGen = value;
}

const getRelevantEntities = (playerPositions: Array<{x: number, y: number}>) => {
    const radius = 480;
    const entities = new Set<string>();
    const constantEnts = trackedEntities.values();
    for (const id of constantEnts) {
        entities.add(id);
    }
    if (entityTreeGrids === undefined) {
        return [];
    }
    for (const pos of playerPositions) {
        const bounds = {
            x1: pos.x - radius,
            y1: pos.y - radius,
            x2: pos.x + radius,
            y2: pos.y + radius
        };
        const staticTests = entityTreeGrids.static.test(bounds, (box2) => {
            return CollisionDetector.testCollision(bounds, box2);
        });
        const dynamicTests = entityTreeGrids.dynamic.test(bounds, (box2) => {
            return CollisionDetector.testCollision(bounds, box2);
        });
        for (const t of [...staticTests, ...dynamicTests]) {
            if (entityManager.has(t.box.id)) {
                entities.add(t.box.id);
            }
        }
    }
    return Array.from(entities.values()).map((id) => entityManager.get(id))
        .filter((ent) => ent !== undefined) as EntityProxy[];
};

const getPlayerPositions = () => {
    const playerIterator = playerManager.entries();
    const positions = [] as Array<{x: number, y: number}>;
    for (const [id, player] of playerIterator) {
        const truePlayer = playerUnproxiedMap.get(player);
        if (truePlayer !== undefined) {
            if (truePlayer.controllingEntity) {
                const entity = truePlayer.controllingEntity;
                const positionComponent = entity.get<Position>("position");
                if (positionComponent !== undefined) {
                    const positionInfo = componentInfoMap.get(positionComponent);
                    if (positionInfo !== undefined && positionInfo.enabled) {
                        try {
                            const x = positionComponent.x;
                            const y = positionComponent.y;
                            if (typeof x === "number" && typeof y === "number" && typeof id === "string") {
                                positions.push({x, y});
                            }
                        }
                        catch (err) {
                            handleComponentError(positionComponent, err);
                        }
                    }
                }
            }
            else {
                const soul = playerSoulMap.get(truePlayer);
                if (soul !== undefined) {
                    positions.push(Object.assign({}, soul.position));
                }
            }
        }
    }
    return positions;
};

export function update() {
    if (collisionBoxInfo === undefined) {
        const entities = entityManager.entries();
        const entityArray = Array.from(entities).map((e) => e[1]);
        collisionBoxInfo = gatherCollisionInfo(entityArray);
    }
    if (entityTreeGrids === undefined) {
        entityTreeGrids = collisionResolver.makeGrids(Array.from(collisionBoxInfo.values()));
    }
    const playerPositions = getPlayerPositions();
    handleMapGen(playerPositions);
    MapGenerator.proceed();
    const relevantEntities = getRelevantEntities(playerPositions);
    // For each component, call update function if exists
    runOn(relevantEntities, "onUpdate", 1 / tickRate);
    runOn(relevantEntities, "onPostUpdate", 1 / tickRate);
    // After the update and postupdate are called we should let the exports know about important changes
    resetExports();

    //
    //  Position export updating + collision box gathering
    //
    entityTreeGrids = updateTreeGrids(entityTreeGrids, Array.from(collisionBoxInfo.values()));
    collisionBoxInfo = gatherCollisionInfo(relevantEntities);

    handleCollisions(collisionBoxInfo);

    gatherDisplay(relevantEntities);

    gatherInspectionInfo();
    handlePlayerSouls();

    playerManager.deleteQueued();
    entityManager.deleteQueued();
    componentManager.deleteQueued();

    exportValues.messages = messageQueue;
    messageQueue = [];
}

const handleMapGen = (positions: Array<{x: number, y: number}>) => {
    if (mapGen) {
        const mapGenSize = 4096;
        for (const position of positions) {
            const x = Math.floor(position.x / mapGenSize);
            const y = Math.floor(position.y / mapGenSize);
            for (let i = x - 1; i < x + 2; i++) {
                for (let j = y - 1; j < y + 2; j++) {
                    if (generatedSections[i] === undefined) {
                        generatedSections[i] = {};
                    }
                    if (!generatedSections[i][j]) {
                        generatedSections[i][j] = true;
                        generateIslands(i, j, mapGenSize);
                    }
                }
            }
        }
    }
};

const generateIslands = (x: number, y: number, mapGenSize: number) => {
    log(`Generating chunk [${x}, ${y}]`);
    if (x === 0 && y === 0) {
        MapGenerator.createGrassIsland(0, 32, 61, 8);
        // Generate the start island
    }
    else {
        const numIslands = Random.int(3, 6);
        for (let i = 0; i < numIslands; i++) {
            const islandX = Random.int(x * mapGenSize / 32, (x + 1) * mapGenSize / 32) * 32;
            const islandY = Random.int(y * mapGenSize / 32, (y + 1) * mapGenSize / 32) * 32;
            const islandWidth = Random.int(40, 65);
            const islandHeight = Random.int(12, 24);
            switch (Random.int(4)) {
                case 0:
                    MapGenerator.createGrassIsland(islandX, islandY, islandWidth, islandHeight);
                    break;
                case 1:
                    MapGenerator.createLakeIsland(islandX, islandY, islandWidth, islandHeight);
                    break;
                case 2:
                    MapGenerator.createIceIsland(islandX, islandY, islandWidth, islandHeight);
                    break;
                case 3:
                    MapGenerator.createLavaIsland(islandX, islandY, islandWidth, islandHeight);
                    break;
            }
        }
        // Generate the start island
    }
};

const updateTreeGrids = (
        grids: {static: QuadtreeGrid<IDBoundingBox>, dynamic: QuadtreeGrid<IDBoundingBox>} | undefined,
        newInfo: CollisionBoxInfo[]) => {
    const boxValues = newInfo;
    const time = Date.now();
    if (grids === undefined) {
        return;
    }
    for (const c of boxValues) {
        if (c.static) {
            grids.static.update({
                id: c.id,
                x1: c.bounds.x1,
                y1: c.bounds.y1,
                x2: c.bounds.x2,
                y2: c.bounds.y2
            });
        }
        else {
            grids.dynamic.update({
                id: c.id,
                x1: c.bounds.x1,
                y1: c.bounds.y1,
                x2: c.bounds.x2,
                y2: c.bounds.y2
            });
        }
    }
    return grids;
};

const gatherCollisionInfo = (entities: EntityProxy[]) => {
    const collisionInfo = new Map<string, CollisionBoxInfo>();
    for (const entity of entities) {
        const id = entity.id;
        exportValues.entities[id] = {
            position: {x: 0, y: 0},
            collisionBox: {x1: 0, y1: 0, x2: 0, y2: 0}
        };
        // Retrieve position info
        // TODO: If position is disabled, default to the last known position if it exists
        // Also do this with the rendering stuff
        const positionComponent = entity.get<Position>("position");
        if (positionComponent !== undefined) {
            const positionInfo = componentInfoMap.get(positionComponent);
            if (positionInfo !== undefined && positionInfo.enabled) {
                try {
                    if (typeof positionComponent.x === "number"
                    && typeof positionComponent.y === "number"
                    ) {
                        const x = positionComponent.x;
                        const y = positionComponent.y;
                        exportValues.entities[id].position = {x, y};
                    }
                }
                catch (err) {
                    handleComponentError(positionComponent, err);
                }
            }
        }
        // Retrieve collision box info
        const collisionComponent = entity.get<CollisionBox>("collision-box");
        if (collisionComponent !== undefined) {
            const collisionBox = componentInfoMap.get(collisionComponent);
            if (collisionBox !== undefined && collisionBox.enabled) {
                try {
                    const x1 = collisionComponent.x1;
                    const y1 = collisionComponent.y1;
                    const x2 = collisionComponent.x2;
                    const y2 = collisionComponent.y2;
                    const isStatic = collisionComponent.static;
                    const dense = collisionComponent.dense;
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
                        if (collisionInfo !== undefined) {
                            if (trackedEntities.has(id)) {
                                trackedEntities.delete(id);
                            }
                            collisionInfo.set(id,
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
                }
                catch (err) {
                    handleComponentError(collisionComponent, err);
                }
            }
        }
        // A sanity check to prevent a collision box of width or height less than 1
        const box = exportValues.entities["" + id].collisionBox;
        if (box.x2 - box.x1 < 1 || box.y2 - box.y1 < 1) {
            box.x2 = box.x1 + 1;
            box.y2 = box.x1 + 1;
        }
    }
    return collisionInfo;
};

const handleCollisions = (collisionBoxes: Map<string, CollisionBoxInfo>) => {
    const boxValues = Array.from(collisionBoxes.values());
    if (entityTreeGrids === undefined) {
        return;
    }
    const collisions = collisionResolver.check(entityTreeGrids, boxValues, (obj1, obj2) => {
        const entity1 = entityManager.get(obj1);
        const entity2 = entityManager.get(obj2);
        if (entity1 !== undefined && entity2 !== undefined) {
            const box1 = entity1.get<CollisionBox>("collision-box");
            const box2 = entity2.get<CollisionBox>("collision-box");
            if (box1 === undefined || box2 === undefined) {
                return false;
            }
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
        }
        return false;
    });
    const collisionsChecked = new Map<string, Set<string>>();
    for (const collision of collisions) {
        if (!collisionsChecked.has(collision.primaryObj)) {
            collisionsChecked.set(collision.primaryObj, new Set<string>());
        }
        const entity = entityManager.get(collision.primaryObj);
        if (entity === undefined) {
            continue;
        }
        const positionComponent = entity.get<Position>("position");
        if (positionComponent !== undefined) {
            const positionInfo = componentInfoMap.get(positionComponent);
            if (positionInfo !== undefined && positionInfo.enabled) {
                try {
                    if (typeof positionComponent.x === "number"
                    && typeof positionComponent.y === "number"
                    ) {
                        positionComponent.x += collision.primaryObjNewPos.x;
                        positionComponent.y += collision.primaryObjNewPos.y;
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
        }
        for (const other of collision.secondaryObjs) {
            if (!collisionsChecked.has(other.id)) {
                collisionsChecked.set(other.id, new Set<string>());
            }

            if (!collisionsChecked.get(collision.primaryObj)!.has(other.id)
                    && !collisionsChecked.get(other.id)!.has(collision.primaryObj)) {
                collisionsChecked.get(collision.primaryObj)!.add(other.id);
                const otherEntity = entityManager.get(other.id);
                if (otherEntity === undefined) {
                    continue;
                }
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
};

const gatherDisplay = (entities: EntityProxy[]) => {
    for (const entity of entities) {
        // TODO: Make it so entities can have multiple displays
        const displayComponent = entity.get<Display>("display");
        if (displayComponent !== undefined) {
            const displayInfo = componentInfoMap.get(displayComponent);
            if (displayInfo !== undefined && displayInfo.enabled) {
                try {
                    const componentID = displayInfo.id;
                    const texture = displayComponent.textureID;
                    const texX = displayComponent.textureX;
                    const texY = displayComponent.textureY;
                    const texWidth = displayComponent.textureWidth;
                    const texHeight = displayComponent.textureHeight;
                    const depth = displayComponent.depth;
                    const xOffset = displayComponent.xOffset;
                    const yOffset = displayComponent.yOffset;
                    const xScale = displayComponent.xScale;
                    const yScale = displayComponent.yScale;
                    const entPosition = exportValues.entities[entity.id].position;
                    if (typeof texX === "number" && typeof texY === "number"
                        && typeof texWidth === "number" && typeof texHeight === "number"
                        && typeof depth === "number" && typeof xOffset === "number"
                        && typeof yOffset === "number" && typeof texture === "string"
                        && typeof xScale === "number" && typeof yScale === "number"
                        && entPosition !== undefined) {
                        exportValues.sprites[componentID] = {
                            ownerID: entity.id,
                            texture,
                            depth,
                            textureSubregion: {x: texX, y: texY, width: texWidth, height: texHeight},
                            position: {x: entPosition.x + xOffset, y: entPosition.y + yOffset},
                            scale: {x: xScale, y: yScale}
                        };
                    }
                }
                catch (err) {
                    handleComponentError(displayComponent, err);
                }
            }
        }
        const soundEmitterComponent = entity.get<SoundEmitter>("sound-emitter");
        if (soundEmitterComponent !== undefined) {
            const soundEmitterInfo = componentInfoMap.get(soundEmitterComponent);
            if (soundEmitterInfo !== undefined && soundEmitterInfo.enabled) {
                try {
                    if (Array.isArray(soundEmitterComponent.soundQueue)) {
                        const entPosition = exportValues.entities[entity.id].position;
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
    }
};

const gatherInspectionInfo = () => {
    // Retrieve entity inspection information
    const playersInspecting = inspectedEntities.keys();
    for (const player of playersInspecting) {
        const entityID = inspectedEntities.get(player);
        if (entityID !== undefined) {
            if (!entityManager.has(entityID)) {
                exportValues.inspectedEntityInfo[player] = {
                    id: entityID,
                    name: "<UNKNOWN>",
                    componentInfo: {}
                };
                continue;
            }
            const entity = entityManager.get(entityID);
            if (entity !== undefined) {
                const components = Array.from(entity.componentIterator());
                const componentInfo = components.reduce((acc, component) => {
                    if (!component.exists) {
                        return acc;
                    }
                    const info = getComponentInfo(component);
                    if (info !== undefined) {
                        acc[component.localID] = info;
                    }
                    return acc;
                }, {} as {[id: string]: ComponentExportInfo});
                const entityInfo: EntityExportInfo = {
                    id: entityID,
                    name: "Entity " + entityID, // temporary
                    componentInfo,
                    controlledBy: entity.controller !== undefined
                        && entity.controller.exists ? entity.controller.id : undefined
                };
                exportValues.inspectedEntityInfo[player] = entityInfo;
            }
        }
    }
};

const handlePlayerSouls = () => {
    const playerIterator = playerManager.entries();
    for (const [playerID, player] of playerIterator) {
        const purePlayer = playerUnproxiedMap.get(player)!;
        if (player.controllingEntity === undefined) {
            const playerSoul = playerSoulMap.get(purePlayer)!;
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
                scale: {
                    x: 1,
                    y: 1
                },
                position: {x: playerSoul.position.x - 16, y: playerSoul.position.y - 16}
            };
            purePlayer.camera.x.base = playerSoul.position.x + 16;
            purePlayer.camera.y.base = playerSoul.position.y + 16;
        }
        else {
            const id = player.controllingEntity.id;
            if (exportValues.entities[id] !== undefined) {
                purePlayer.camera.x.base = exportValues.entities[id].position.x + 16;
                purePlayer.camera.y.base = exportValues.entities[id].position.y + 16;
            }
            else {
                purePlayer.camera.x.base = 0;
                purePlayer.camera.y.base = 0;
            }
        }
        exportValues.players[playerID] = {camera: {
            x: purePlayer.camera.x.getValue(),
            y: purePlayer.camera.y.getValue(),
            scale: purePlayer.camera.scale.getValue()
        }};
    }
};

function getComponentInfo(component: Component): ComponentExportInfo | undefined {
    const keys = Object.keys(component);
    const info = componentInfoMap.get(component);
    if (info !== undefined) {
        // TODO: Make it so that circular types can be serialized in some way
        // Maybe use the prefab serialization method?
        const attributes = keys
            .filter(((key) => key.substr(0, 1) !== "_"))
            .map((key) => {
                let value = (component as any)[key];
                if (typeof value === "object" && typeof value.displayData === "object") {
                    value = value.displayData;
                }
                return {
                    name: key,
                    kind: typeof value,
                    value: Stringifier.stringify(value)
                };
            });
        return {
            id: info.id,
            name: component.localID,
            enabled: info.enabled,
            lastFrameTime: info.lastFrameTime,
            attributes
        };
    }
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
    return ent.id;
}

const _getEntity = (id: string): EntityProxy | undefined => {
    return entityManager.get(id);
};

export function getEntity(id: string) {
    return _getEntity(id);
}

const _deleteEntity = (id: string) => {
    entityManager.queueForDeletion(id);
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
};

export function deleteComponent(componentID: string) {
    return _deleteComponent(componentID);
}

export function create(classParam: string | ClassInterface, ...args: any[]) {
    let classToCreate: ClassInterface | undefined;
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
            if (truePlayer !== undefined) {
                const soul = playerSoulMap.get(truePlayer)!;
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
        if (entity !== undefined) {
            player.control(entity);
        }
        else {
            player.release();
        }
    }
}

export function getPlayerControllingEntity(id: string) {
    const player = playerManager.get(id);
    if (player === undefined) {
        return undefined;
    }
    return player.controllingEntity !== undefined ? player.controllingEntity.id : undefined;
}

export function setComponentEnableState(componentID: string, state: boolean) {
    const component = componentManager.get(componentID);
    if (component !== undefined) {
        const info = componentInfoMap.get(component);
        if (info !== undefined) {
            if (state) {
                info.manualEnable();
            }
            else {
                info.enabled = false;
            }
        }
    }
}

export function setResourceList(playerUsername: string, resources: Resource[]) {
    const resourceMap = new Map<string, Resource>();
    for (const resource of resources) {
        resourceMap.set(resource.filename, resource);
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
        if (info !== undefined) {
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
                    entID: entityUnproxiedMap.get(obj)!.id,
                    parentID,
                    name
                });
            }
            else if (playerUnproxiedMap.has(obj)) {
                collect.playerReferences.push({
                    playerID: playerUnproxiedMap.get(obj)!.id,
                    parentID,
                    name
                });
            }
            else if (componentInfoUnproxiedMap.has(obj)) {
                collect.componentInfoReferences.push({
                    componentID: componentInfoUnproxiedMap.get(obj)!.id,
                    parentID,
                    name
                });
            }
        },
        (obj) => {
            if (componentInfoMap.has(obj)) {
                return componentInfoMap.get(obj)!.id;
            }
            return undefined;
        }
    ) as GameObjectCollection;
    serializedMap.serializedData = serializedObj;
    serializedMap.generatedSections = generatedSections;
}

export function setGeneratedSections(newGeneratedSections: {[x: number]: {[y: number]: boolean}}) {
    Object.assign(generatedSections, newGeneratedSections);
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
                    revivedObj = new (classList.get(data.module)!)();
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

export function setComponentMeta(componentID: string, property: string, value: string) {
    const component = componentManager.get(componentID);
    if (component !== undefined) {
        switch (property) {
            case "name": {
                component.localID = value;
                break;
            }
            case "description": {
                component.description = value;
                break;
            }
        }
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
