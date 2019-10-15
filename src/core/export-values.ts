import Client from "./client";
import Group from "./group";

interface ComponentExportInfo {
    id: string;
    name: string;
    attributes: Array<{name: string, kind: string, value: string}>;
}

interface EntityExportInfo {
    id: string;
    name: string;
    componentInfo: {[localID: string]: ComponentExportInfo};
}

export default interface Exports {
    entities: {[id: string]: {
        position: {x: number, y: number},
        collisionBox: {x1: number, y1: number, x2: number, y2: number}
    }};
    inspectedEntityInfo: {[playerID: string]: EntityExportInfo};
    players?: {[playerID: string]: Client};
    messages?: Array<{recipient: Group<Client>, message: string}>;
}
