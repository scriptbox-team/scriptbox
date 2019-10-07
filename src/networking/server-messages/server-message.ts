import PlayerGroup from "core/player-group";
import ServerNetEvent from "networking/server-net-event";

/**
 * A server message specifying a server net event to send to one or more recipients.
 *
 * @export
 * @class ServerMessage
 */
export default class ServerMessage {
    public recipient: PlayerGroup;
    public message: ServerNetEvent;
    /**
     * Creates an instance of ServerMessage.
     * @param {ServerNetEvent} message The ServerNetEvent to send
     * @param {PlayerGroup} recipient The recipient(s) of the message.
     * @memberof ServerMessage
     */
    constructor(message: ServerNetEvent, recipient: PlayerGroup) {
        this.recipient = recipient;
        this.message = message;
    }
}
