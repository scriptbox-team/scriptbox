import _ from "lodash";
import Resource from "resource-management/resource";
import Packet from "./packet";

/**
 * A packet containing shared resource repository information sent to the client.
 *
 * @export
 * @class ServerResourceRepoListPacket
 * @extends {Packet}
 * @module networking
 */
export default class ServerResourceRepoListPacket extends Packet {
    public static deserialize(obj: any): ServerResourceRepoListPacket | undefined {
        if (typeof obj === "object" && obj !== null) {
            if (
                Array.isArray(obj.resources)
                && typeof obj.search === "string"
            ) {
                const resourceArray: Resource[] = [];
                const allClear = _.every(obj.resources, (elem) => {
                    const res = Resource.serialize(
                        elem.id,
                        elem.type,
                        elem.name,
                        elem.filename,
                        elem.creator,
                        elem.owner,
                        elem.description,
                        elem.time,
                        elem.icon,
                        elem.shared
                    );
                    if (res !== undefined) {
                        resourceArray.push(res);
                        return true;
                    }
                    return false;
                });
                if (allClear) {
                    return new ServerResourceRepoListPacket(obj.search, resourceArray);
                }
            }
            return undefined;
        }
    }

    public search: string;
    public resources: Resource[];
    constructor(search: string, resources: Resource[]) {
        super();
        this.search = search;
        this.resources = resources;
    }
    public serialize() {
        return this;
    }
}
