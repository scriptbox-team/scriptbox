import Packet from "./packet";

export default class ClientEntityInspectionPacket extends Packet {
    public static deserialize(obj: any) {
        if (typeof obj === "object" && obj !== null) {
            if (
                typeof obj.entityID === "string" || obj.entityID === undefined
            ) {
                return new ClientEntityInspectionPacket(obj.entityID);
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
