/**
 * An interface of what contains essential data belonging to the player.
 *
 * @interface IPlayerData
 */
interface IPlayerData {
    /**
     * The player's username.
     *
     * @type {string}
     * @memberof IPlayerData
     */
    username: string;
    displayName: string;
}

/**
 * A proxy for the methods used to retrieve data from a PlayerManager
 * This exists to prevent the Player objects from having direct access to the PlayerManager.
 *
 * @export
 * @class PlayerManagerInterface
 */
export default class PlayerManagerInterface {
    private _getData: (id: number) => IPlayerData;
    private _setDisplayName: (id: number, newName: string) => void;
    /**
     * Creates an instance of PlayerManagerInterface.
     * @param {(id: number) => IPlayerData} getData The function to get a player's data.
     * @memberof PlayerManagerInterface
     */
    constructor(getData: (id: number) => IPlayerData, setDisplayName: (id: number, newName: string) => void) {
        this._getData = getData;
        this._setDisplayName = setDisplayName;
    }
    /**
     * Get the username of a player
     *
     * @param {number} id The ID of the player
     * @returns {string} The username of the player.
     * @memberof PlayerManagerInterface
     */
    public getUsername(id: number): string {
        return this._getData(id).username;
    }

    public getDisplayName(id: number): string {
        return this._getData(id).displayName;
    }

    public setDisplayName(id: number, newName: string) {
        this._setDisplayName(id, newName);
    }
}
