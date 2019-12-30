import _ from "lodash";
import Resource from "resource-management/resource";
import Packet from "./packet";

/**
 * A packet containing a list of resource information sent to the client.
 *
 * @export
 * @class ServerResourceListingPacket
 * @extends {Packet}
 * @module networking
 */
export default class ServerResourceListingPacket extends Packet {
    public static deserialize(obj: any): ServerResourceListingPacket | undefined {
        if (typeof obj === "object" && obj !== null) {
            if (
                Array.isArray(obj.resources)
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
                    return new ServerResourceListingPacket(resourceArray);
                }
            }
            return undefined;
        }
    }

    public resources: Resource[];
    constructor(resources: Resource[]) {
        super();
        this.resources = resources;
    }
    public serialize() {
        return this;
    }
}
