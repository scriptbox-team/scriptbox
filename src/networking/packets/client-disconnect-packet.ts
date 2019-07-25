import Packet from "./packet";

/**
 * A packet which contains disconnection information from the client.
 *
 * @export
 * @class ClientDisconnectPacket
 * @extends {Packet}
 */
export default class ClientDisconnectPacket extends Packet {
    public static deserialize(obj: any): ClientDisconnectPacket | undefined {
        if (typeof obj === "object" && obj !== null) {
            if (
                typeof obj.code === "number"
            ) {
                return new ClientDisconnectPacket(obj.code);
            }
            return undefined;
        }
    }

    public code: number;
    constructor(code: number) {
        super();
        this.code = code;
    }
    public serialize() {
        return this;
    }
}
