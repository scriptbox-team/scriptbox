import Packet from "./packet";

/**
 * A packet containing a chat message from the server.
 *
 * @export
 * @class ServerChatMessagePacket
 * @extends {Packet}
 */
export default class ServerChatMessagePacket extends Packet {
    public static deserialize(obj: any): ServerChatMessagePacket | undefined {
        if (typeof obj === "object" && obj !== null) {
            if (
                typeof obj.message === "string"
            ) {
                return new ServerChatMessagePacket(obj.message);
            }
            return undefined;
        }
    }

    public message: string;
    constructor(message: string) {
        super();
        this.message = message;
    }
    public serialize() {
        return this;
    }
}
