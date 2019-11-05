import Packet from "./packet";

/**
 * A packet containing connection information from the client.
 *
 * @export
 * @class ClientConnectionInfoPacket
 * @extends {Packet}
 */
export default class ClientConnectionInfoPacket extends Packet {
    public static deserialize(obj: any): ClientConnectionInfoPacket | undefined {
        if (typeof obj === "object" && obj !== null
            && typeof obj.token === "string") {
            return new ClientConnectionInfoPacket(obj.token);
        }
    }

    public token: string;
    constructor(token: string) {
        super();
        this.token = token;
    }
    public serialize() {
        return this;
    }
}
