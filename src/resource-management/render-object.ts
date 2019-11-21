export default class RenderObject {
    public static serialize(
        ownerID: string,
        id: string,
        texture: string,
        textureSubregion: {x: number, y: number, width: number, height: number},
        position: {x: number, y: number},
        scale: {x: number, y: number},
        depth: number,
        deleted: boolean
    ) {
        if (
                typeof ownerID === "string" || ownerID === undefined
                && typeof id === "string"
                && typeof texture === "string"
                && typeof textureSubregion === "object"
                && typeof textureSubregion.x === "number"
                && typeof textureSubregion.y === "number"
                && typeof textureSubregion.width === "number"
                && typeof textureSubregion.height === "number"
                && typeof position === "object"
                && typeof position.x === "number"
                && typeof position.y === "number"
                && typeof scale === "object"
                && typeof scale.x === "number"
                && typeof scale.y === "number"
                && typeof depth === "number"
                && typeof deleted === "boolean"
        ) {
            return new RenderObject(ownerID, id, texture, textureSubregion, position, scale, depth, deleted);
        }
    }
    public ownerID: string | undefined;
    public id: string;
    public texture: string;
    public textureSubregion: {x: number, y: number, width: number, height: number};
    public position: {x: number, y: number};
    public scale: {x: number, y: number};
    public depth: number;
    public deleted: boolean;
    constructor(
        ownerID: string | undefined,
        id: string,
        texture: string,
        subregion: {x: number, y: number, width: number, height: number},
        position: {x: number, y: number},
        scale: {x: number, y: number},
        depth: number,
        deleted: boolean
    ) {
        this.ownerID = ownerID;
        this.id = id;
        this.texture = texture;
        this.textureSubregion = subregion;
        this.position = position;
        this.scale = scale;
        this.depth = depth;
        this.deleted = deleted;
    }
}
