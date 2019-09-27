import Packet from "./packet";

export default class ClientExecuteScriptPacket extends Packet {
    public static deserialize(obj: any): ClientExecuteScriptPacket | undefined {
        if (typeof obj === "object" && obj !== null) {
            if (
                typeof obj.script === "string"
                && typeof obj.args === "string"
                && typeof obj.entityID === "number" || typeof obj.entityID === "undefined"
            ) {
                return new ClientExecuteScriptPacket(obj.script, obj.args, obj.entityID);
            }
            return undefined;
        }
    }

    public script: string;
    public args: string;
    public entityID?: number;
    constructor(script: string, args: string, entityID?: number) {
        super();
        this.script = script;
        this.args = args;
        this.entityID = entityID;
    }
    public serialize() {
        return this;
    }
}
