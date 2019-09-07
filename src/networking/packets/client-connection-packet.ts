import Packet from "./packet";

/**
 * A "meta packet" which contains information from a complete connection from a player.
 * This is created by the server as a full representation of a complete connection handshake.
 *
 * @export
 * @class ClientConnectionPacket
 * @extends {Packet}
 */
export default class ClientConnectionPacket extends Packet {
    public static deserialize(obj: any): ClientConnectionPacket | undefined {
        if (typeof obj === "object" && obj !== null) {
            if (
                typeof obj.clientID === "number"
                && typeof obj.ip === "string"
            ) {
                return new ClientConnectionPacket(obj.clientID, obj.ip);
            }
            return undefined;
        }
    }

    public clientID: number;
    public ip: string;
    constructor(clientID: number, ip: string) {
        super();
        this.clientID = clientID;
        this.ip = ip;
    }
    public serialize() {
        return this;
    }
}
