import Packet from "./packet";

export default class ClientEntityDeletionPacket extends Packet {
    public static deserialize(obj: any): ClientEntityDeletionPacket | undefined {
        if (typeof obj === "object" && obj !== null) {
            if (
                typeof obj.id === "string"
            ) {
                return new ClientEntityDeletionPacket(obj.id);
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
