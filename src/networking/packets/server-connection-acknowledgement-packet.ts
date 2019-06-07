import Packet from "./packet";

/**
 * A packet which acknowledges a valid client connection, from the server to the client.
 *
 * @export
 * @class ServerConnectionAcknowledgementPacket
 * @extends {Packet}
 */
export default class ServerConnectionAcknowledgementPacket extends Packet {
    public static deserialize(obj: any): ServerConnectionAcknowledgementPacket | undefined {
        if (typeof obj === "object" && obj !== null) {
            return new ServerConnectionAcknowledgementPacket();
        }
    }

    constructor() {
        super();
    }
    public serialize() {
        return this;
    }
}
