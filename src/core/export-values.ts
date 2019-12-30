import Client from "./client";

interface ComponentExportInfo {
    id: string;
    name: string;
    enabled: boolean;
    attributes: Array<{name: string, kind: string, value: string}>;
    lastFrameTime: number;
}

interface EntityExportInfo {
    id: string;
    name: string;
    controlledBy?: string;
    componentInfo: {[localID: string]: ComponentExportInfo};
}

interface SoundInfo {
    position: {
        x: number;
        y: number;
    };
    resource: string;
    volume: number;
}

/**
 * The information of a single message exported from GameSystem.
 * This includes the message itself along with the recipients and the kind of message.
 * @export
 * @interface MessageExportInfo
 * @module core
 */
export interface MessageExportInfo {
    message: string;
    kind: "Chat" | "Announcement" | "Error";
    recipient: string[];
}

/**
 * The information exported from the scripted segment of GameSystem.
 * This differs slightly from the version within the scripted segment, as the player
 * information is populated with the client before it exits GameSystem.
 *
 * @export
 * @interface Exports
 */
export default interface Exports {
    entities: {[id: string]: {
        position: {x: number, y: number},
        collisionBox: {x1: number, y1: number, x2: number, y2: number},
    }};
    sprites: {[id: string]: {
        ownerID: string | undefined,
        texture: string,
        textureSubregion: {x: number, y: number, width: number, height: number};
        position: {x: number, y: number};
        scale: {x: number, y: number};
        depth: number;
    }};
    inspectedEntityInfo: {[playerID: string]: EntityExportInfo};
    messages: MessageExportInfo[];
    players: {[id: string]: {
        client?: Client,
        camera: {x: number, y: number, scale: number}
    }};
    sounds: {[id: string]: SoundInfo};
}
