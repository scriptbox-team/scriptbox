import PlayerNetworkManager from "networking/player-network-manager";
import ServerNetEvent from "networking/server-net-event";
import ServerMessage from "./server-message";
import { MessageRecipientType } from "./server-message-recipient";

/**
 * A class responsible for converting outgoing server messages into packets to be sent to multiple clients.
 *
 * @export
 * @class ServerMessageBroadcaster
 */
export default class ServerMessageBroadcaster {
    private _packetCallback: ((client: number, event: ServerNetEvent) => void) | undefined;
    private _messageQueue: ServerMessage[];
    private _playerNetworkManager: PlayerNetworkManager;
    /**
     * Creates an instance of ServerMessageBroadcaster.
     * @param {PlayerNetworkManager} playerNetworkManager The PlayerNetworkManager to retrieve data from.
     * @memberof ServerMessageBroadcaster
     */
    constructor(playerNetworkManager: PlayerNetworkManager) {
        this._playerNetworkManager = playerNetworkManager;
        this._messageQueue = [];
    }
    /**
     * Send all of the queued messages to its recipients.
     *
     * @memberof ServerMessageBroadcaster
     */
    public sendMessages() {
        for (const m of this._messageQueue) {
            switch (m.recipient.recipientType) {
                case MessageRecipientType.All: {
                    const players = this._playerNetworkManager.getConnectedPlayers();
                    for (const c of players) {
                        const connection = this._playerNetworkManager.getclientIDFromPlayerID(c);
                        if (connection != null) {
                            this.sendPacket(connection, m.message);
                        }
                    }
                    break;
                }
                case MessageRecipientType.Except: {
                    const playerSet = new Set(this._playerNetworkManager.getConnectedPlayers());
                    for (const c of m.recipient.players) {
                        playerSet.delete(c.id);
                    }
                    for (const c of playerSet) {
                        const connection = this._playerNetworkManager.getclientIDFromPlayerID(c);
                        if (connection != null) {
                            this.sendPacket(connection, m.message);
                        }
                    }
                    break;
                }
                case MessageRecipientType.Only: {
                    for (const c of m.recipient.players) {
                        const connection = this._playerNetworkManager.getClientIDFromPlayer(c);
                        if (connection != null) {
                            this.sendPacket(connection, m.message);
                        }
                    }
                    break;
                }
            }
        }
        this._messageQueue = [];
    }
    /**
     * Set a callback which activates when the broadcaster needs to send a packet somewhere.
     *
     * @param {(c: number, message: ServerNetEvent) => void} callback The callback to execute when a packet is sent.
     * @memberof ServerMessageBroadcaster
     */
    public setPacketCallback(callback: (c: number, message: ServerNetEvent) => void) {
        this._packetCallback = callback;
    }
    /**
     * Add a message to the queue.
     *
     * @param {ServerMessage} message The message to queue.
     * @memberof ServerMessageBroadcaster
     */
    public addToQueue(message: ServerMessage) {
        this._messageQueue.push(message);
    }
    /**
     * Send a packet using the callback.
     *
     * @private
     * @param {number} c The client to send the packet to.
     * @param {ServerNetEvent} message The net event to send.
     * @memberof ServerMessageBroadcaster
     */
    private sendPacket(c: number, message: ServerNetEvent) {
        this._packetCallback!(c, message);
    }
}
