import Packet from "./packet";

export default class ClientExecuteScriptPacket extends Packet {
    public static deserialize(obj: any): ClientExecuteScriptPacket | undefined {
        if (typeof obj === "object" && obj !== null) {
            if (typeof obj.script === "string" && typeof obj.args === "string") {
                return new ClientExecuteScriptPacket(obj.script, obj.args);
            }
            return undefined;
        }
    }

    public script: string;
    public args: string;
    constructor(script: string, args: string) {
        super();
        this.script = script;
        this.args = args;
    }
    public serialize() {
        return this;
    }
}
