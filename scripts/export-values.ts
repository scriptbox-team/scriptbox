export interface ComponentExportInfo {
    id: string;
    name: string;
    enabled: boolean;
    attributes: Array<{name: string, kind: string, value: string}>;
    lastFrameTime: number;
}

export interface EntityExportInfo {
    id: string;
    name: string;
    controlledBy?: string;
    componentInfo: {[localID: string]: ComponentExportInfo};
}
export interface MessageExportInfo {
    message: string;
    kind: "chat" | "announcement" | "status" | "error" | "error-status";
    recipient: string[];
}

export default interface Exports {
    entities: {[id: string]: {
        position: {x: number, y: number},
        collisionBox: {x1: number, y1: number, x2: number, y2: number},
    }};
    sprites: {[id: string]: {
        ownerID: string,
        texture: string,
        textureSubregion: {x: number, y: number, width: number, height: number};
        offset: {x: number, y: number};
        depth: number;
    }};
    inspectedEntityInfo: {[playerID: string]: EntityExportInfo};
    messages: MessageExportInfo[];
}
