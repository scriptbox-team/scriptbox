import Packet from "./packet";

export default class ClientCloneResourcePacket extends Packet {
    public static deserialize(obj: any): ClientCloneResourcePacket | undefined {
        if (typeof obj === "object" && obj !== null) {
            if (
                typeof obj.resourceID === "string"
            ) {
                return new ClientCloneResourcePacket(obj.resourceID);
            }
            return undefined;
        }
    }

    public resourceID: string;
    constructor(resourceID: string) {
        super();
        this.resourceID = resourceID;
    }
    public serialize() {
        return this;
    }
}
