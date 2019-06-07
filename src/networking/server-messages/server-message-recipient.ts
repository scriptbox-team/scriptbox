import Player from "core/players/player";

/**
 * A recipient type to add meaning to the players associated with a message.
 * This can either be "All" for all clients, "Except" for all except particular clients,
 * and "Only" for only particular clients.
 *
 * @export
 * @enum {number}
 */
export enum MessageRecipientType {
    All,
    Except,
    Only
}

/**
 * A representation of a set of players to include or exclude from something, such as a server message.
 *
 * @export
 * @class MessageRecipient
 */
export class MessageRecipient {
    public recipientType: MessageRecipientType;
    public players: Player[];
    /**
     * Creates an instance of MessageRecipient.
     * @param {MessageRecipientType} recipientType The way to interpret the player list.
     * @param {Player[]} players The list of players to include/exclude
     * @memberof MessageRecipient
     */
    constructor(recipientType: MessageRecipientType, players: Player[]) {
        this.recipientType = recipientType;
        this.players = players;
    }
}
