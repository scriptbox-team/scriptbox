import _ from "lodash";
import Resource from "resource-management/resource";
import Packet from "./packet";

export default class ServerEntityInspectionListingPacket extends Packet {
    public static deserialize(obj: any): ServerEntityInspectionListingPacket | undefined {
        if (typeof obj === "object" && obj !== null) {
            if (
                Array.isArray(obj.displayPackage)
                && typeof(obj.entityID) === "string"
            ) {
                const renderObjectArray = [];
                const allClear = _.every(obj.resources, (elem) => {
                    const res = Resource.serialize(
                        elem.id,
                        elem.type,
                        elem.name,
                        elem.creator,
                        elem.description,
                        elem.time,
                        elem.settings,
                        elem.icon
                    );
                    if (res !== undefined) {
                        renderObjectArray.push(res);
                        return true;
                    }
                    return false;
                });
                if (allClear) {
                    return new ServerEntityInspectionListingPacket(obj.resources, obj.entityID);
                }
            }
            return undefined;
        }
    }

    public resources: Resource[];
    public entityID: string;
    constructor(resources: Resource[], entityID: string) {
        super();
        this.resources = resources;
        this.entityID = entityID;
    }
    public serialize() {
        return this;
    }
}
