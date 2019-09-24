import _ from "lodash";
import Packet from "./packet";

export default class ClientKeybindsPacket extends Packet {
    public static deserialize(obj: any): ClientKeybindsPacket | undefined {
        if (typeof obj === "object" && obj !== null) {
            if (typeof obj.keys === "object" && obj.keys !== null && typeof obj.entityID === "string") {
                const allClear = _.every(Object.keys(obj.keys), (key) => {
                    return typeof obj.keys[key] === "string";
                });
                if (allClear) {
                    return new ClientKeybindsPacket(obj.keys, obj.entityID);
                }
            }
            return undefined;
        }
    }

    public entityID: string;
    public keys: {[key: string]: string};
    constructor(keys: {[key: string]: string}, entityID: string) {
        super();
        this.keys = keys;
        this.entityID = entityID;
    }
    public serialize() {
        return this;
    }
}
