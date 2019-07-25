import Packet from "./packet";

/**
 * A packet containing connection information from the client.
 *
 * @export
 * @class ClientConnectionInfoPacket
 * @extends {Packet}
 */
export default class ClientConnectionInfoPacket extends Packet {
    public static deserialize(obj: any): ClientConnectionInfoPacket | undefined {
        if (typeof obj === "object" && obj !== null) {
            return new ClientConnectionInfoPacket();
        }
    }

    constructor() {
        super();
    }
    public serialize() {
        return this;
    }
}
