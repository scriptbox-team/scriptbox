import Packet from "./packet";

/**
 * A packet which contains a disconnection request from the client.
 * This may be removed later.
 *
 * @export
 * @class ClientDisconnectRequestPacket
 * @extends {Packet}
 * @module networking
 */
export default class ClientDisconnectRequestPacket extends Packet {
    public static deserialize(obj: any): ClientDisconnectRequestPacket | undefined {
        if (typeof obj === "object" && obj !== null) {
            return new ClientDisconnectRequestPacket();
        }
    }

    constructor() {
        super();
    }
    public serialize() {
        return this;
    }
}
