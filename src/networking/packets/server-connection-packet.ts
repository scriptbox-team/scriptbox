import Packet from "./packet";

/**
 * A "meta-packet" of the server's full confirmation that the client has connected.
 *
 * @export
 * @class ServerConnectionPacket
 * @extends {Packet}
 */
export default class ServerConnectionPacket extends Packet {
    public static deserialize(obj: any): ServerConnectionPacket | undefined {
        return new ServerConnectionPacket();
    }
    constructor() {
        super();
    }
    public serialize() {
        return this;
    }
}
