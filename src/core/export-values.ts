import Client from "./client";

interface ComponentExportInfo {
    id: string;
    name: string;
    enabled: boolean;
    attributes: Array<{name: string, kind: string, value: string}>;
}

interface EntityExportInfo {
    id: string;
    name: string;
    controlledBy?: string;
    componentInfo: {[localID: string]: ComponentExportInfo};
}
export interface MessageExportInfo {
    message: string;
    kind: "Chat" | "Announcement" | "Error";
    recipient: string[];
}

export default interface Exports {
    entities: {[id: string]: {
        position: {x: number, y: number},
        collisionBox: {x1: number, y1: number, x2: number, y2: number}
    }};
    inspectedEntityInfo: {[playerID: string]: EntityExportInfo};
    players?: {[playerID: string]: Client};
    messages: MessageExportInfo[];
}
