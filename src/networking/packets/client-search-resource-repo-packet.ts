import Packet from "./packet";

export default class ClientSearchResourceRepoPacket extends Packet {
    public static deserialize(obj: any): ClientSearchResourceRepoPacket | undefined {
        if (typeof obj === "object" && obj !== null) {
            if (
                typeof obj.search === "string"
            ) {
                return new ClientSearchResourceRepoPacket(obj.search);
            }
            return undefined;
        }
    }

    public search: string;
    constructor(search: string) {
        super();
        this.search = search;
    }
    public serialize() {
        return this;
    }
}
