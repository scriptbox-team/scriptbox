import Packet from "./packet";

/**
 * A packet containing changes to be made to a script of a particular ID.
 *
 * @export
 * @class ClientEditScriptPacket
 * @extends {Packet}
 * @module networking
 */
export default class ClientEditScriptPacket extends Packet {
    public static deserialize(obj: any): ClientEditScriptPacket | undefined {
        if (typeof obj === "object" && obj !== null) {
            if (
                typeof obj.scriptID === "string"
                && typeof obj.script === "string"
            ) {
                return new ClientEditScriptPacket(obj.scriptID, obj.script);
            }
            return undefined;
        }
    }

    public scriptID: string;
    public script: string;
    constructor(scriptID: string, script: string) {
        super();
        this.scriptID = scriptID;
        this.script = script;
    }
    public serialize() {
        return this;
    }
}
