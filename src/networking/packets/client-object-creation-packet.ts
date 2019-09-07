import Packet from "./packet";

export default class ClientObjectCreationPacket extends Packet {
    public static deserialize(obj: any): ClientObjectCreationPacket | undefined {
        if (typeof obj === "object" && obj !== null) {
            if (
                typeof obj.prefabID === "string"
                && typeof obj.x === "number"
                && typeof obj.y === "number"
            ) {
                return new ClientObjectCreationPacket(obj.prefabID, obj.x, obj.y);
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
