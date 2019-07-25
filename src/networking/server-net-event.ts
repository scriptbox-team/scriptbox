/**
 * The kind of event the server event is.
 *
 * @export
 * @enum {number}
 */
export enum ServerEventType {
    Connection = 1000,
    ConnectionInfoRequest = 1001,
    ConnectionAcknowledgement = 1002,
    Disconnection = 1003,
    ChatMessage = 1004,
    DisplayPackage = 1005
}

/**
 * A network event originating from the server.
 * This contains an event type and serialized packet data.
 *
 * @export
 * @class ServerNetEvent
 */
export default class ServerNetEvent {
    /**
     * Deserialize from data into a proper ServerNetEvent
     *
     * @static
     * @param {*} str The serialized data to deserialize
     * @returns {(ServerNetEvent | undefined)} ServerNetEvent if deserialization was successful, undefined if it was not
     * @memberof ServerNetEvent
     */
    public static deserialize(str: any): ServerNetEvent | undefined {
        if (typeof str === "string") {
            const obj = JSON.parse(str);
            if (typeof obj.type === "number" && typeof obj.data === "object") {
                return new ServerNetEvent(obj.type, obj.data);
            }
        }
        return undefined;
    }

    public type: ServerEventType;
    public data: any;
    /**
     * Creates an instance of ServerNetEvent.
     * @param {ServerEventType} type
     * @param {*} data
     * @memberof ServerNetEvent
     */
    constructor(type: ServerEventType, data: any) {
        this.type = type;
        this.data = data;
    }
    /**
     * Convert the ServerNetEvent to serialized data.
     *
     * @returns {string} The serialized string of data.
     * @memberof ServerNetEvent
     */
    public serialize(): string {
        return JSON.stringify(this);
    }
}
