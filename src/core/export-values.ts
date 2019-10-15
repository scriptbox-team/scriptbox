import Client from "./client";
import Group from "./group";

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

export default interface IExports {
    entities: {[id: string]: {
        position: {x: number, y: number},
        collisionBox: {x1: number, y1: number, x2: number, y2: number}
    }};
    inspectedEntityInfo: {[playerID: string]: IEntityInfo};
    players?: {[playerID: string]: Client};
    messages?: Array<{recipient: Group<Client>, message: string}>;
}
