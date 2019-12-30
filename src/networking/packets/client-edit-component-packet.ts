import Packet from "./packet";

/**
 * A packet containing information about changes to be made to a property within a component.
 * The data is stored as a string with associated type information.
 *
 * @export
 * @class ClientEditComponentPacket
 * @extends {Packet}
 * @module networking
 */
export default class ClientEditComponentPacket extends Packet {
    public static deserialize(obj: any): ClientEditComponentPacket | undefined {
        if (typeof obj === "object" && obj !== null) {
            if (
                    typeof obj.componentID === "string"
                    && typeof obj.property === "string"
                    && typeof obj.value === "string"
                    && typeof obj.type === "string"
            ) {
                return new ClientEditComponentPacket(obj.componentID, obj.property, obj.value, obj.type);
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
