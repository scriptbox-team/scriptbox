import Client from "core/client";
import { GroupType } from "core/group";
import Manager from "core/manager";
import ServerNetEvent from "networking/server-net-event";

import ServerMessage from "./server-message";

/**
 * A class responsible for converting outgoing server messages into packets to be sent to multiple clients.
 *
 * @export
 * @class ServerMessageBroadcaster
 */
export default class ServerMessageBroadcaster {
    private _packetCallback: ((client: number, event: ServerNetEvent) => void) | undefined;
    private _messageQueue: ServerMessage[];
    private _playerManager: Manager<Client>;
    /**
     * Creates an instance of ServerMessageBroadcaster.
     * @param {PlayerNetworkManager} playerNetworkManager The PlayerNetworkManager to retrieve data from.
     * @memberof ServerMessageBroadcaster
     */
    constructor(playerManager: Manager<Client>) {
        this._playerManager = playerManager;
        this._messageQueue = [];
    }
    /**
     * Send all of the queued messages to its recipients.
     *
     * @memberof ServerMessageBroadcaster
     */
    public sendMessages() {
        for (const m of this._messageQueue) {
            switch (m.recipient.groupType) {
                case GroupType.All: {
                    const pairs = this._playerManager.entries();
                    for (const [k, v] of pairs) {
                        const connection = v.netClientID;
                        if (connection !== undefined) {
                            this._sendPacket(connection, m.message);
                        }
                    }
                    break;
                }
                case GroupType.Except: {
                    const pairs = this._playerManager.entries();
                    const playersToSendTo: Client[] = [];
                    for (const [k, v] of pairs) {
                        if (m.recipient.list.findIndex((p) => p.id === v.id) === -1) {
                            playersToSendTo.push(v);
                        }
                    }
                    for (const c of playersToSendTo) {
                        const connection = c.netClientID;
                        if (connection !== undefined) {
                            this._sendPacket(connection, m.message);
                        }
                    }
                    break;
                }
                case GroupType.Only: {
                    for (const c of m.recipient.list) {
                        const connection = c.netClientID;
                        if (connection !== undefined) {
                            this._sendPacket(connection, m.message);
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
    public setPacketCallback(callback: (clientID: number, message: ServerNetEvent) => void) {
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
    private _sendPacket(clientID: number, message: ServerNetEvent) {
        this._packetCallback!(clientID, message);
    }
}
