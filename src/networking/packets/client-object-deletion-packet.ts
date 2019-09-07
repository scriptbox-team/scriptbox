import Packet from "./packet";

export default class ClientObjectDeletionPacket extends Packet {
    public static deserialize(obj: any): ClientObjectDeletionPacket | undefined {
        if (typeof obj === "object" && obj !== null) {
            if (
                typeof obj.id === "number"
            ) {
                return new ClientObjectDeletionPacket(obj.id);
            }
            return undefined;
        }
    }

    public id: number;
    constructor(id: number) {
        super();
        this.id = id;
    }
    public serialize() {
        return this;
    }
}
