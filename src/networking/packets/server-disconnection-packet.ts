import Packet from "./packet";

/**
 * A packet containing the server's notification that the client has disconnected.
 *
 * @export
 * @class ServerDisconnectionPacket
 * @extends {Packet}
 * @module networking
 */
export default class ServerDisconnectionPacket extends Packet {
    public static deserialize(obj: any): ServerDisconnectionPacket | undefined {
        if (typeof obj === "object" && obj !== null) {
            return new ServerDisconnectionPacket();
        }
    }

    constructor() {
        super();
    }
    public serialize() {
        return this;
    }
}
