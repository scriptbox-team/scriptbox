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
                && typeof obj.username === "string"
            ) {
                return new ClientConnectionPacket(obj.clientID, obj.ip, obj.username);
            }
            return undefined;
        }
    }

    public clientID: number;
    public ip: string;
    public username: string;
    constructor(clientID: number, ip: string, username: string) {
        super();
        this.clientID = clientID;
        this.ip = ip;
        this.username = username;
    }
    public serialize() {
        return this;
    }
}
