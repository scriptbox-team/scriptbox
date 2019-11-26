import Packet from "./packet";

export default class ClientPrefabCreationPacket extends Packet {
    public static deserialize(obj: any): ClientPrefabCreationPacket | undefined {
        if (typeof obj === "object" && obj !== null) {
            if (
                typeof obj.id === "string"
            ) {
                return new ClientPrefabCreationPacket(obj.id);
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
