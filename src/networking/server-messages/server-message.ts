import ServerNetEvent from "networking/server-net-event";
import { MessageRecipient } from "./server-message-recipient";

/**
 * A server message specifying a server net event to send to one or more recipients.
 *
 * @export
 * @class ServerMessage
 */
export default class ServerMessage {
    public recipient: MessageRecipient;
    public message: ServerNetEvent;
    /**
     * Creates an instance of ServerMessage.
     * @param {ServerNetEvent} message The ServerNetEvent to send
     * @param {MessageRecipient} recipient The recipient(s) of the message.
     * @memberof ServerMessage
     */
    constructor(message: ServerNetEvent, recipient: MessageRecipient) {
        this.recipient = recipient;
        this.message = message;
    }
}
