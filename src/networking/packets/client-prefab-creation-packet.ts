import Packet from "./packet";

/**
 * A packet containing a request to create a prefab from a particular existing entity.
 *
 * @export
 * @class ClientPrefabCreationPacket
 * @extends {Packet}
 * @module networking
 */
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
