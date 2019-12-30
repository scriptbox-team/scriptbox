import Packet from "./packet";

/**
 * A packet containing connection information from the client.
 *
 * @export
 * @class ClientConnectionInfoPacket
 * @extends {Packet}
 * @module networking
 */
export default class ClientConnectionInfoPacket extends Packet {
    public static deserialize(obj: any): ClientConnectionInfoPacket | undefined {
        if (typeof obj === "object" && obj !== null
            && typeof obj.token === "string"
            && typeof obj.username === "string") {
            return new ClientConnectionInfoPacket(obj.token, obj.username);
        }
    }

    public token: string;
    public username: string;
    constructor(token: string, username: string) {
        super();
        this.token = token;
        this.username = username;
    }
    public serialize() {
        return this;
    }
}
