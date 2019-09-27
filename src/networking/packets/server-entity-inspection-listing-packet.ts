import _ from "lodash";
import ComponentInfo from "resource-management/component-info";
import Packet from "./packet";

export default class ServerEntityInspectionListingPacket extends Packet {
    public static deserialize(obj: any): ServerEntityInspectionListingPacket | undefined {
        if (typeof obj === "object" && obj !== null) {
            if (
                Array.isArray(obj.components)
                && typeof(obj.entityID) === "number"
            ) {
                const componentArray: ComponentInfo[] = [];
                const allClear = _.every(obj.resources, (elem) => {
                    const res = ComponentInfo.serialize(
                        elem.id,
                        elem.name,
                        elem.creator,
                        elem.description,
                        elem.time,
                        elem.icon,
                        elem.settings
                    );
                    if (res !== undefined) {
                        componentArray.push(res);
                        return true;
                    }
                    return false;
                });
                if (allClear) {
                    return new ServerEntityInspectionListingPacket(obj.components, obj.entityID);
                }
            }
            return undefined;
        }
    }

    public components: ComponentInfo[];
    public entityID: number;
    constructor(components: ComponentInfo[], entityID: number) {
        super();
        this.components = components;
        this.entityID = entityID;
    }
    public serialize() {
        return this;
    }
}
