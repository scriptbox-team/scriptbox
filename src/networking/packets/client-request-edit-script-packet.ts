import Packet from "./packet";

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
