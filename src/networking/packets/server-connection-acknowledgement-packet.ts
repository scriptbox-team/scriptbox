import Packet from "./packet";

/**
 * A packet which acknowledges a valid client connection, from the server to the client.
 *
 * @export
 * @class ServerConnectionAcknowledgementPacket
 * @extends {Packet}
 * @module networking
 */
export default class ServerConnectionAcknowledgementPacket extends Packet {
    public static deserialize(obj: any): ServerConnectionAcknowledgementPacket | undefined {
        if (typeof obj === "object" && obj !== null
            && typeof obj.resourceServerIP === "string") {
            return new ServerConnectionAcknowledgementPacket(obj.resourceServerIP);
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
