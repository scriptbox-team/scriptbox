import Packet from "./packet";

/**
 * A packet containing script text to apply to a script resource.
 *
 * @export
 * @class ServerEntityInspectionListingPacket
 * @extends {Packet}
 * @module networking
 */
export default class ServerScriptTextPacket extends Packet {
    public static deserialize(obj: any): ServerScriptTextPacket | undefined {
        if (typeof obj === "object" && obj !== null) {
            if (
                typeof obj.scriptID === "string"
                && typeof obj.script === "string"
            ) {
                return new ServerScriptTextPacket(obj.scriptID, obj.script);
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
