import Packet from "./packet";

/**
 * A "meta-packet" of the server's full confirmation that the client has connected.
 *
 * @export
 * @class ServerConnectionPacket
 * @extends {Packet}
 * @module networking
 */
export default class ServerConnectionPacket extends Packet {
    public static deserialize(obj: any): ServerConnectionPacket | undefined {
        if (typeof obj === "object" && obj !== null
            && typeof obj.resourceServerIP === "string") {
            return new ServerConnectionPacket(obj.resourceServerIP);
        }
    }
    public resourceServerIP: string;
    constructor(resourceServerIP: string) {
        super();
        this.resourceServerIP = resourceServerIP;
    }

    public serialize() {
        return this;
    }
}
