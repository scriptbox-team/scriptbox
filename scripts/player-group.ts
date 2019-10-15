import Player from "./player";

/**
 * A group type to add meaning to the players associated with the player group.
 * This can either be "All" for all players, "Except" for all except particular players,
 * and "Only" for only particular players.
 *
 * @export
 * @enum {number}
 */
export enum PlayerGroupType {
    All,
    Except,
    Only
}

/**
 * A representation of a set of players to include or exclude from something, such as a server message.
 *
 * @export
 * @class PlayerGroup
 */
export default class PlayerGroup {
    public groupType: PlayerGroupType;
    public players: Player[];
    /**
     * Creates an instance of PlayerGroup.
     * @param {PlayerGroupType} groupType The way to interpret the player list.
     * @param {Player[]} players The list of players to include/exclude
     * @memberof MessageRecipient
     */
    constructor(groupType: PlayerGroupType, players: Player[]) {
        this.groupType = groupType;
        this.players = players;
    }
}
