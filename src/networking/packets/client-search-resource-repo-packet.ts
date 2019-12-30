import Packet from "./packet";

/**
 * A packet containing search terms to find resources from the global repository
 *
 * @export
 * @class ClientSearchResourceRepoPacket
 * @extends {Packet}
 * @module networking
 */
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
