import Packet from "./packet";

/**
 * The type of an input.
 * Press and Release are for buttons, and move is for axes.
 *
 * @export
 * @enum {number}
 */
enum InputType {
    Press = 0,
    Release = 1,
    Move = 2
}

/**
 * The type of device an input came from
 *
 * @export
 * @enum {number}
 */
enum DeviceType {
    Keyboard = 0,
    Mouse = 1,
    Controller = 2
}

/**
 * A packet containing information about a single input from the client.
 *
 * @export
 * @class ClientInputPacket
 * @extends {Packet}
 * @module networking
 */
export default class ClientKeyboardInputPacket extends Packet {
    public static readonly InputType = InputType;
    public static readonly DeviceType = DeviceType;
    public static deserialize(obj: any): ClientKeyboardInputPacket | undefined {
        if (typeof obj === "object" && obj !== null) {
            if (
                typeof obj.key === "number"
                && typeof obj.state === "number"
                && typeof obj.device === "number"
            ) {
                if (!("" + obj.state in InputType)) {
                    throw new Error("Invalid enum value " + obj.state);
                }
                if (!("" + obj.device in DeviceType)) {
                    throw new Error("Invalid enum value " + obj.device);
                }
                return new ClientKeyboardInputPacket(obj.key, obj.state, obj.device);
            }
            return undefined;
        }
    }

    public key: number;
    public state: InputType;
    public device: DeviceType;
    constructor(key: number, state: InputType, device: DeviceType) {
        super();
        this.key = key;
        this.state = state;
        this.device = device;
    }
    public serialize() {
        return this;
    }
}
