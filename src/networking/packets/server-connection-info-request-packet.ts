import Packet from "./packet";

/**
 * A packet from the server which acts as a request for information from the client that just connected.
 *
 * @export
 * @class ServerConnectionInfoRequestPacket
 * @extends {Packet}
 * @module networking
 */
export default class ServerConnectionInfoRequestPacket extends Packet {
    public static deserialize(obj: any): ServerConnectionInfoRequestPacket | undefined {
        if (typeof obj === "object" && obj !== null) {
            return new ServerConnectionInfoRequestPacket();
        }
    }

    constructor() {
        super();
    }
    public serialize() {
        return this;
    }
}
