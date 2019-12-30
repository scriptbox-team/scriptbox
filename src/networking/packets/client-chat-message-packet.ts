import Packet from "./packet";

/**
 * A packet containing a chat message from the client.
 *
 * @export
 * @class ClientChatMessagePacket
 * @extends {Packet}
 * @module networking
 */
export default class ClientChatMessagePacket extends Packet {
    public static deserialize(obj: any): ClientChatMessagePacket | undefined {

        if (typeof obj === "object" && obj !== null) {
            if (typeof obj.message === "string"
            ) {
                return new ClientChatMessagePacket(obj.message);
            }
            return undefined;
        }
    }

    /**
     * The message sent from the client.
     *
     * @type {string}
     * @memberof ClientChatMessagePacket
     */
    public message: string;
    constructor(message: string) {
        super();
        this.message = message;
    }
    public serialize() {
        return this;
    }
}
