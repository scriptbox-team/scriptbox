import Packet from "./packet";

/**
 * A packet containing information about a component that is to be added to an entity
 *
 * @export
 * @class ClientAddComponentPacket
 * @extends {Packet}
 * @module networking
 */
export default class ClientAddComponentPacket extends Packet {
    public static deserialize(obj: any): ClientAddComponentPacket | undefined {
        if (typeof obj === "object" && obj !== null) {
            if (
                typeof obj.componentClassID === "string"
                && typeof obj.entityID === "string"
            ) {
                return new ClientAddComponentPacket(obj.componentClassID, obj.entityID);
            }
            return undefined;
        }
    }

    public componentClassID: string;
    public entityID: string;
    constructor(componentClassID: string, entityID: string) {
        super();
        this.componentClassID = componentClassID;
        this.entityID = entityID;
    }
    public serialize() {
        return this;
    }
}
