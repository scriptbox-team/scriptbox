import _ from "lodash";
import Resource from "resource-management/resource";
import Packet from "./packet";

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
                        elem.creator,
                        elem.description,
                        elem.time,
                        elem.icon,
                        elem.options
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
