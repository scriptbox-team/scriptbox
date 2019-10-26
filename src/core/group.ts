/**
 * A group type to add meaning to the players associated with the player group.
 * This can either be "All" for all players, "Except" for all except particular players,
 * and "Only" for only particular players.
 *
 * @export
 * @enum {number}
 */
export enum GroupType {
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
export default class Group<T> {
    public groupType: GroupType;
    public list: T[];
    /**
     * Creates an instance of PlayerGroup.
     * @param {GroupType} groupType The way to interpret the player list.
     * @param {Client[]} players The list of players to include/exclude
     * @memberof MessageRecipient
     */
    constructor(groupType: GroupType, list: T[]) {
        this.groupType = groupType;
        this.list = list;
    }
}
