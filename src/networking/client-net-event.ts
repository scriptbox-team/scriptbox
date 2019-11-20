/**
 * The kind of event the client event is
 *
 * @export
 * @enum {number}
 */
export enum ClientEventType {
    ConnectionInfo = 0,
    Connection = 1,
    DisconnectionRequest = 2,
    Disconnect = 3,
    ChatMessage = 4,
    Input = 5,
    EntityCreation = 6,
    EntityDeletion = 7,
    TokenRequest = 8,
    ModifyMetadata = 9,
    AddComponent = 10,
    RemoveComponent = 11,
    EditComponent = 12,
    ExecuteScript = 13,
    Keybinds = 14,
    EntityInspection = 15,
    SetControl = 16,
    SetComponentEnableState = 17,

    CloneResource = 18,
    SearchResourceRepo = 19,
    RequestEditScript = 20,
    EditScript = 21,
    ModifyComponentMeta = 22
}

/**
 * A single client net event, containing the packet type and the serialized data of the packet.
 *
 * @export
 * @class ClientNetEvent
 */
export default class ClientNetEvent {
    public static deserialize(str: any): ClientNetEvent | undefined {
        if (typeof str === "string") {
            const obj = JSON.parse(str);
            if (typeof obj.type === "number" && typeof obj.data === "object") {
                return new ClientNetEvent(obj.type, obj.data);
            }
        }
        return undefined;
    }

    public type: ClientEventType;
    public data: any;
    constructor(type: ClientEventType, data: any) {
        this.type = type;
        this.data = data;
    }
    public serialize(): string {
        return JSON.stringify(this);
    }
}
