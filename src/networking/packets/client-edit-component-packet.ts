import Packet from "./packet";

export default class ClientEditComponentPacket extends Packet {
    public static deserialize(obj: any): ClientEditComponentPacket | undefined {
        if (typeof obj === "object" && obj !== null) {
            if (
                    typeof obj.componentID === "string"
                    && typeof obj.property === "string"
                    && typeof obj.value === "string"
                    && typeof obj.valueType === "string"
            ) {
                return new ClientEditComponentPacket(obj.componentID, obj.property, obj.value, obj.valueType);
            }
            return undefined;
        }
    }

    public componentID: string;
    public property: string;
    public value: string;
    public type: string;
    constructor(componentID: string, property: string, value: string, type: string) {
        super();
        this.componentID = componentID;
        this.property = property;
        this.value = value;
        this.type = type;
    }
    public serialize() {
        return this;
    }
}
