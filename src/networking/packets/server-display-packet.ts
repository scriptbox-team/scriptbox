import _ from "lodash";
import RenderObject from "resource-management/render-object";
import Packet from "./packet";

/**
 * A packet containing visual display information sent to the client.
 *
 * @export
 * @class ServerDisplayPacket
 * @extends {Packet}
 * @module networking
 */
export default class ServerDisplayPacket extends Packet {
    public static deserialize(obj: any): ServerDisplayPacket | undefined {
        if (typeof obj === "object" && obj !== null) {
            if (
                Array.isArray(obj.displayPackage)
            ) {
                const renderObjectArray = [];
                const allClear = _.every(obj.displayPackage, (elem) => {
                    const renderObject = RenderObject.serialize(
                        elem.ownerID,
                        elem.id,
                        elem.texture,
                        elem.textureSubregion,
                        elem.position,
                        elem.scale,
                        elem.depth,
                        elem.deleted
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
