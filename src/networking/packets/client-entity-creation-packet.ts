import Packet from "./packet";

/**
 * A packet containing the creation of an entity using a prefab and a position.
 *
 * @export
 * @class ClientEntityCreationPacket
 * @extends {Packet}
 * @module networking
 */
export default class ClientEntityCreationPacket extends Packet {
    public static deserialize(obj: any): ClientEntityCreationPacket | undefined {
        if (typeof obj === "object" && obj !== null) {
            if (
                typeof obj.prefabID === "string"
                && typeof obj.x === "number"
                && typeof obj.y === "number"
            ) {
                return new ClientEntityCreationPacket(obj.prefabID, obj.x, obj.y);
            }
            return undefined;
        }
    }

    public prefabID: string;
    public x: number;
    public y: number;
    constructor(prefabID: string, x: number, y: number) {
        super();
        this.prefabID = prefabID;
        this.x = x;
        this.y = y;
    }
    public serialize() {
        return this;
    }
}
