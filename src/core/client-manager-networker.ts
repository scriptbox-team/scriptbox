import NetEventHandler from "networking/net-event-handler";
import Networker from "networking/networker";
import ClientConnectionPacket from "networking/packets/client-connection-packet";
import ClientDisconnectPacket from "networking/packets/client-disconnect-packet";

import Client from "./client";
import IDGenerator from "./id-generator";
import Manager from "./manager";

/**
 * Interfaces between a Client Manager and the networking components of the program.
 * This takes incoming packets and calls the associated functions in the system, and receives
 * callbacks from the Client Manager to send outgoing packets.
 *
 * @export
 * @class ClientManagerNetworker
 * @extends {Networker}
 * @module core
 */
export default class ClientManagerNetworker extends Networker {
    private _playerManager: Manager<Client>;
    private _idGenerator: IDGenerator;
    /**
     * Creates an instance of ClientManagerNetworker.
     * @param {Manager<Client>} playerManager The manager to connect to.
     * @param {IDGenerator} idGenerator An ID generator to use for client IDs.
     * @memberof ClientManagerNetworker
     */
    constructor(playerManager: Manager<Client>, idGenerator: IDGenerator) {
        super();
        this.playerCreate = this.playerCreate.bind(this);
        this.playerDelete = this.playerDelete.bind(this);
        this._playerManager = playerManager;
        this._idGenerator = idGenerator;
    }
    /**
     * Hook up the networker with a NetEventHandler.
     *
     * @param {NetEventHandler} netEventHandler The NetEventHandler to hook up with.
     * @memberof ClientManagerNetworker
     */
    public hookupInput(netEventHandler: NetEventHandler) {
        netEventHandler.playerCreate = this.playerCreate;
        netEventHandler.playerRemove = this.playerDelete;
    }
    /**
     * A delegate which creates a client when a connection packet is received.
     *
     * @param {number} connectionID The ID of the connection the packet came from.
     * @param {ClientConnectionPacket} packet The connection packet.
     * @returns The created client.
     * @memberof ClientManagerNetworker
     */
    public playerCreate(connectionID: number, packet: ClientConnectionPacket) {
        const playerNum = connectionID;
        const playerID = this._idGenerator.makeFrom("P", Date.now(), Math.random());
        const username = packet.username;
        const displayName = packet.username;
        const player = this._playerManager.create(playerID, connectionID, username, displayName);
        return player;
    }
    /**
     * A delegate which deletes a client when a disconnection packet is received.
     *
     * @param {ClientDisconnectPacket} packet The disconnection packet.
     * @param {Client} player The client the packet came from.
     * @memberof ClientManagerNetworker
     */
    public playerDelete(
            packet: ClientDisconnectPacket,
            player: Client) {
        this._playerManager.queueForDeletion(player.id);
    }
}
