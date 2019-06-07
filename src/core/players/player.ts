import Entity from "core/entities/entity";
import PlayerManagerInterface from "./player-manager-interface";

/**
 * A player that is connected to the server.
 * This is not the entity the player is controlling but rather the things about the player itself.
 * The data for the player is contained within the PlayerManager. However, this class uses
 * a PlayerManagerInterface to call the methods of the PlayerManager for security reasons.
 *
 * @export
 * @class Player
 */
export default class Player {
    public id: number;
    private _playerManagerInterface: PlayerManagerInterface;
    /**
     * Creates an instance of Player.
     * This should only be called by the PlayerManager.
     * @param {number} id The ID of the player to create
     * @param {PlayerManagerInterface} playerManagerInterface An interface to the methods to get player information.
     * @memberof Player
     */
    constructor(id: number, playerManagerInterface: PlayerManagerInterface) {
        this.id = id;
        this._playerManagerInterface = playerManagerInterface;
    }
    /**
     * The user name of the player.
     *
     * @readonly
     * @type {string}
     * @memberof Player
     */
    get name(): string {
        return this._playerManagerInterface.getName(this.id);
    }
    /**
     * The entity the player is currently controlling.
     * Null if the player isn't controlling any entity currently.
     *
     * @readonly
     * @type {(Entity | null)}
     * @memberof Player
     */
    get controllingEntity(): Entity | null {
        return this._playerManagerInterface.getControllingEntity(this.id);
    }
}
