export default class RenderObject {
    public static serialize(
        id: number,
        texture: string,
        textureSubregion: {x: number, y: number, width: number, height: number},
        position: {x: number, y: number},
        depth: number
    ) {
        if (
                typeof id === "number"
                && typeof texture === "string"
                && typeof textureSubregion === "object"
                && typeof textureSubregion.x === "number"
                && typeof textureSubregion.y === "number"
                && typeof textureSubregion.width === "number"
                && typeof textureSubregion.height === "number"
                && typeof position === "object"
                && typeof position.x === "number"
                && typeof position.y === "number"
                && typeof depth === "number"
        ) {
            return new RenderObject(id, texture, textureSubregion, position, depth);
        }
    }
    public id: number;
    public texture: string;
    public textureSubregion: {x: number, y: number, width: number, height: number};
    public position: {x: number, y: number};
    public depth: number;
    constructor(
        id: number,
        texture: string,
        subregion: {x: number, y: number, width: number, height: number},
        position: {x: number, y: number},
        depth: number
    ) {
        this.id = id;
        this.texture = texture;
        this.textureSubregion = subregion;
        this.position = position;
        this.depth = depth;
    }
}
