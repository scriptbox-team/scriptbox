import Packet from "./packet";

export default class ServerCameraUpdatePacket extends Packet {
    public static deserialize(obj: any): ServerCameraUpdatePacket | undefined {
        if (typeof obj === "object" && obj !== null) {
            if (
                typeof obj.x === "number"
                && typeof obj.y === "number"
                && typeof obj.scale === "number"
            ) {
                return new ServerCameraUpdatePacket(obj.x, obj.y, obj.scale);
            }
            return undefined;
        }
    }

    public x: number;
    public y: number;
    public scale: number;
    constructor(x: number, y: number, scale: number) {
        super();
        this.x = x;
        this.y = y;
        this.scale = scale;
    }
    public serialize() {
        return this;
    }
}
