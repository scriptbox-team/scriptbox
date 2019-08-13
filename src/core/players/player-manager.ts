import Player from "./player";
import PlayerManagerInterface from "./player-manager-interface";

/**
 * An interface containing the data essential to a player.
 *
 * @interface IPlayerData
 */
interface IPlayerData {
    username: string;
    displayName: string;
    controllingEntity: number | null;
}

/**
 * A manager which handles the essential aspects of players.
 * Specifically, this handles player creation and deletion, and data management.
 *
 * @export
 * @class PlayerManager
 */
export default class PlayerManager {
    private _players: Map<number, IPlayerData> = new Map<number, IPlayerData>();
    private _nextPlayerID: number = 0;

    /**
     * Creates an instance of PlayerManager.
     * @memberof PlayerManager
     */
    constructor() {
        this.getData = this.getData.bind(this);
        this.setDisplayName = this.setDisplayName.bind(this);
    }

    /**
     * Create a player with the specified information.
     *
     * @param {IPlayerData} info The information to create the player with.
     * @returns {Player} A player object representing the created player.
     * @memberof PlayerManager
     */
    public createPlayer(info: IPlayerData): Player {
        const id = this._nextPlayerID++;
        this._players.set(id, info);
        return this.idToPlayerObject(id);
    }
    /**
     * Check if a player exists.
     *
     * @param {number} id The ID of the player to check
     * @returns True if the player exists, false if they were deleted or never existed.
     * @memberof PlayerManager
     */
    public playerExists(id: number) {
        return this._players.has(id);
    }
    /**
     * Get the IDs of players who are currently connected to the server.
     *
     * @returns {number[]} The IDs of the players that are connected
     * @memberof PlayerManager
     */
    public getPlayerIDs(): number[] {
        return Array.from(this._players.keys());
    }
    /**
     * Delete a player.
     *
     * @param {Player} player The player to delete
     * @memberof PlayerManager
     */
    public removePlayer(player: Player) {
        this._players.delete(player.id);
    }
    /**
     * Convert a player ID to a player object with usable methods.
     *
     * @param {number} id The ID of the player to create a player object for.
     * @returns {Player} A player object associated with the player ID.
     * @memberof PlayerManager
     */
    public idToPlayerObject(id: number): Player {
        const player = new Player(id, new PlayerManagerInterface(this.getData, this.setDisplayName));
        return player;
    }
    /**
     * Get all of the data related to a single player.
     * Throws an error if a player of the given ID does not exist.
     *
     * @private
     * @param {number} id The ID of the player to get the data for.
     * @returns {IPlayerData} The data for the player of the ID passed in.
     * @memberof PlayerManager
     */
    private getData(id: number): IPlayerData {
        const data = this._players.get(id);
        if (data === undefined) {
            throw new Error("Player of ID " + id + " does not exist");
        }
        return data;
    }

    private setDisplayName(id: number, newDisplayName: string) {
        const data = this._players.get(id);
        if (data === undefined) {
            throw new Error("Player of ID " + id + " does not exist");
        }
        data.displayName = newDisplayName;
    }
}
