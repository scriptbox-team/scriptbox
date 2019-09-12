import Packet from "./packet";

export default class ClientWatchEntityPacket extends Packet {
    public static deserialize(obj: any) {
        if (typeof obj === "object" && obj !== null) {
            if (
                typeof obj.entityID === "number" || obj.entityID === undefined
            ) {
                return new ClientWatchEntityPacket(obj.entityID);
            }
            return undefined;
        }
    }
    public entityID?: number;
    constructor(entityID?: number) {
        super();
        this.entityID = entityID;
    }
    public serialize() {
        return this;
    }
}
