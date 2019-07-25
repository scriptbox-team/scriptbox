import Player from "core/players/player";
import ClientConnectionPacket from "./packets/client-connection-packet";
import ClientDisconnectPacket from "./packets/client-disconnect-packet";

/**
 * A manager which handles all of the information for players related to networking.
 * This includes things like which clients are connected to which players among other things.
 * This link is updated VIA delegates which are called when connection or disconnection packets are received.
 *
 * @export
 * @class PlayerNetworkManager
 */
export default class PlayerNetworkManager {
    private _clientToPlayer: Map<number, Player>;
    private _playerToClient: Map<number, number>;
    /**
     * Creates an instance of PlayerNetworkManager.
     * @memberof PlayerNetworkManager
     */
    constructor() {
        this._clientToPlayer = new Map<number, Player>();
        this._playerToClient = new Map<number, number>();

        this.connectionDelegate = this.connectionDelegate.bind(this);
        this.disconnectionDelegate = this.disconnectionDelegate.bind(this);
    }
    /**
     * Associate a client with a player
     *
     * @param {number} client The client ID to associate
     * @param {Player} player The player to associate the ID with
     * @memberof PlayerNetworkManager
     */
    public setClientPlayer(client: number, player: Player) {
        this._clientToPlayer.set(client, player);
        this._playerToClient.set(player.id, client);
    }
    /**
     * Remove an association by client
     *
     * @param {number} client The ID of the client to remove
     * @memberof PlayerNetworkManager
     */
    public removeClient(client: number): void {
        if (!this._clientToPlayer.has(client)) {
            return;
        }
        const player = this._clientToPlayer.get(client);
        this._clientToPlayer.delete(client);
        this._playerToClient.delete(player!.id);
    }
    /**
     * Remove an association by player
     *
     * @param {Player} player The player to remove
     * @memberof PlayerNetworkManager
     */
    public removePlayer(player: Player): void {
        if (!this._playerToClient.has(player.id)) {
            return;
        }
        const client = this._playerToClient.get(player.id);
        this._playerToClient.delete(player.id);
        this._clientToPlayer.delete(client!);
    }
    /**
     * Get a map associating client IDs with players
     *
     * @returns The map associating clients to players
     * @memberof PlayerNetworkManager
     */
    public getClientToPlayer() {
        return this._clientToPlayer;
    }

    /**
     * Get a map associating players with client IDs
     *
     * @returns the map associating players to clients
     * @memberof PlayerNetworkManager
     */
    public getPlayerToClient() {
        return this._playerToClient;
    }

    /**
     * Get all of the players that are currently registered with the player network manager
     *
     * @returns
     * @memberof PlayerNetworkManager
     */
    public getConnectedPlayers() {
        return Array.from(this._playerToClient.keys());
    }

    /**
     * Get a player from a client Id
     *
     * @param {number} clientID The ID of the client
     * @returns {(Player | undefined)} A player if they exist, undefined if they don't
     * @memberof PlayerNetworkManager
     */
    public getPlayerFromConnectionID(clientID: number): Player | undefined {
        return this._clientToPlayer.get(clientID);
    }

    /**
     * Get a client ID associated with a player
     *
     * @param {Player} player The player to get the client ID for
     * @returns {(number | undefined)} The ID if the client exists, undefined otherwise
     * @memberof PlayerNetworkManager
     */
    public getClientIDFromPlayer(player: Player): number | undefined {
        return this.getclientIDFromPlayerID(player.id);
    }

    /**
     * Get a client ID associated with a player ID
     *
     * @param {number} player The player ID to get the client ID for
     * @returns {(number | undefined)} The ID if the client exists, undefined otherwise
     * @memberof PlayerNetworkManager
     */
    public getclientIDFromPlayerID(id: number): number | undefined {
        return this._playerToClient.get(id);
    }

    /**
     * The delegate to be called when a client connects
     *
     * @param {ClientConnectionPacket} packet The packet the client connected with
     * @param {(Player | undefined)} player The player which connected. Should always be a Player
     * @memberof PlayerNetworkManager
     */
    public connectionDelegate(packet: ClientConnectionPacket, player: Player | undefined) {
        this.setClientPlayer(packet.clientID, player!);
    }
    /**
     * The delegate to be called when a client connects
     *
     * @param {ClientDisconnectPacket} packet The packet the client disconnected with
     * @param {(Player | undefined)} player The player which connected. Should always be a Player
     * @memberof PlayerNetworkManager
     */
    public disconnectionDelegate(packet: ClientDisconnectPacket, player: Player | undefined) {
        this.removePlayer(player!);
    }
}
