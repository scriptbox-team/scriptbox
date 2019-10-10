import Packet from "./packet";

export default class ClientRemoveComponentPacket extends Packet {
    public static deserialize(obj: any): ClientRemoveComponentPacket | undefined {
        if (typeof obj === "object" && obj !== null) {
            if (
                typeof obj.componentID === "string"
            ) {
                return new ClientRemoveComponentPacket(obj.componentID);
            }
            return undefined;
        }
    }

    public componentID: string;
    constructor(componentID: string) {
        super();
        this.componentID = componentID;
    }
    public serialize() {
        return this;
    }
}
