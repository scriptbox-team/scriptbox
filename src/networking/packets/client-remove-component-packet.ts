import Packet from "./packet";

/**
 * A packet containing a request remove a component from an entity.
 *
 * @export
 * @class ClientRemoveComponentPacket
 * @extends {Packet}
 * @module networking
 */
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
