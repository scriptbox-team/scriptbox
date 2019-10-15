import Client from "core/client";
import Group from "core/group";
import ServerNetEvent from "networking/server-net-event";

/**
 * A server message specifying a server net event to send to one or more recipients.
 *
 * @export
 * @class ServerMessage
 */
export default class ServerMessage {
    public recipient: Group<Client>;
    public message: ServerNetEvent;
    /**
     * Creates an instance of ServerMessage.
     * @param {ServerNetEvent} message The ServerNetEvent to send
     * @param {Group} recipient The recipient(s) of the message.
     * @memberof ServerMessage
     */
    constructor(message: ServerNetEvent, recipient: Group<Client>) {
        this.recipient = recipient;
        this.message = message;
    }
}
