import Packet from "./packet";

/**
 * A packet containing information about a single input from the client.
 *
 * @export
 * @class ClientInputPacket
 * @extends {Packet}
 */
export default class ClientInputPacket extends Packet {
    public static deserialize(obj: any): ClientInputPacket | undefined {
        if (typeof obj === "object" && obj !== null) {
            if (
                typeof obj.key === "number"
            ) {
                return new ClientInputPacket(obj.key);
            }
            return undefined;
        }
    }

    public key: number;
    constructor(key: number) {
        super();
        this.key = key;
    }
    public serialize() {
        return this;
    }
}
