import _ from "lodash";
import RenderObject from "resource-management/render-object";
import Packet from "./packet";

export default class ServerDisplayPacket extends Packet {
    public static deserialize(obj: any): ServerDisplayPacket | undefined {
        if (typeof obj === "object" && obj !== null) {
            if (
                Array.isArray(obj.displayPackage)
            ) {
                const renderObjectArray = [];
                const allClear = _.every(obj.displayPackage, (elem) => {
                    const renderObject = RenderObject.serialize(
                        elem.id,
                        elem.texture,
                        elem.subregion,
                        elem.position,
                        elem.depth
                    );
                    if (renderObject !== undefined) {
                        renderObjectArray.push(renderObject);
                        return true;
                    }
                    return false;
                });
                if (allClear) {
                    return new ServerDisplayPacket(obj.displayPackage);
                }
            }
            return undefined;
        }
    }

    public displayPackage: RenderObject[];
    constructor(displayPackage: RenderObject[]) {
        super();
        this.displayPackage = displayPackage;
    }
    public serialize() {
        return this;
    }
}
