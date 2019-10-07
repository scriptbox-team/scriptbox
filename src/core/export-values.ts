import Player from "./player";
import PlayerGroup from "./player-group";

interface IComponentInfo {
    id: number;
    name: string;
    attributes: Array<{name: string, kind: string, value: string}>;
}

interface IEntityInfo {
    id: number;
    name: string;
    componentInfo: {[localID: string]: IComponentInfo};
}

export default interface IExports {
    entities: {[id: string]: {
        position: {x: number, y: number},
        collisionBox: {x1: number, y1: number, x2: number, y2: number}
    }};
    watchedEntityInfo: {[watcherID: string]: IEntityInfo};
    players?: {[playerID: string]: Player};
    messages?: Array<{recipient: PlayerGroup, message: string}>;
}
