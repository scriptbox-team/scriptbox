import Packet from "./packet";

/**
 * A packet containing a request to retrieve the source code to a script
 *
 * @export
 * @class ClientRequestEditScriptPacket
 * @extends {Packet}
 * @module networking
 */
export default class ClientRequestEditScriptPacket extends Packet {
    public static deserialize(obj: any): ClientRequestEditScriptPacket | undefined {
        if (typeof obj === "object" && obj !== null) {
            if (
                typeof obj.scriptID === "string"
            ) {
                return new ClientRequestEditScriptPacket(obj.scriptID);
            }
            return undefined;
        }
    }

    public scriptID: string;
    constructor(scriptID: string) {
        super();
        this.scriptID = scriptID;
    }
    public serialize() {
        return this;
    }
}
