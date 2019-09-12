import _ from "lodash";
import Resource from "resource-management/resource";
import Packet from "./packet";

export default class ServerEntityInspectionListingPacket extends Packet {
    public static deserialize(obj: any): ServerEntityInspectionListingPacket | undefined {
        if (typeof obj === "object" && obj !== null) {
            if (
                Array.isArray(obj.resources)
                && typeof(obj.entityID) === "number"
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
                    return new ServerEntityInspectionListingPacket(resourceArray, obj.entityID);
                }
            }
            return undefined;
        }
    }

    public resources: Resource[];
    public entityID: number;
    constructor(resources: Resource[], entityID: number) {
        super();
        this.resources = resources;
        this.entityID = entityID;
    }
    public serialize() {
        return this;
    }
}
