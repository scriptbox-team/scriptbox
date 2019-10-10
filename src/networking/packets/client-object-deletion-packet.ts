import Packet from "./packet";

export default class ClientObjectDeletionPacket extends Packet {
    public static deserialize(obj: any): ClientObjectDeletionPacket | undefined {
        if (typeof obj === "object" && obj !== null) {
            if (
                typeof obj.id === "string"
            ) {
                return new ClientObjectDeletionPacket(obj.id);
            }
            return undefined;
        }
    }

    public id: string;
    constructor(id: string) {
        super();
        this.id = id;
    }
    public serialize() {
        return this;
    }
}
