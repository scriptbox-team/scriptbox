import Packet from "./packet";

export default class ClientSetControlPacket extends Packet {
    public static deserialize(obj: any): ClientSetControlPacket | undefined {
        if (typeof obj === "object" && obj !== null) {
            if (
                    typeof obj.entityID === "string" || typeof obj.entityID === "undefined"
            ) {
                return new ClientSetControlPacket(obj.entityID);
            }
            return undefined;
        }
    }

    public entityID?: string;
    constructor(entityID?: string) {
        super();
        this.entityID = entityID;
    }
    public serialize() {
        return this;
    }
}
