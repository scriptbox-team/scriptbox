import Manager from "core/manager";
import Player from "core/player";
import ServerMessage from "networking/server-messages/server-message";
import ServerMessageBroadcaster from "networking/server-messages/server-message-broadcaster";

import NetHost from "./net-host";
import Networker from "./networker";
import ServerNetEvent from "./server-net-event";

/**
 * A subsystem for the Network system concerned with sending messages to clients.
 * This queues up messages to be sent on the next server tick.
 *
 * @export
 * @class NetworkSendingSubsystem
 */
export default class NetworkSendingSubsystem {
    private _netHost: NetHost;
    private _serverMessageBroadcaster: ServerMessageBroadcaster;
    constructor(netHost: NetHost, playerManager: Manager<Player>) {
        this._netHost = netHost;
        this._serverMessageBroadcaster = new ServerMessageBroadcaster(playerManager);
        this._serverMessageBroadcaster.setPacketCallback((client: number, message: ServerNetEvent) => {
            this._netHost.send(client, message);
        });
    }

    /**
     * Queue a server message to send on the next server tick.
     *
     * @param {ServerMessage} message
     * @memberof NetworkSendingSubsystem
     */
    public queue(message: ServerMessage) {
        this._serverMessageBroadcaster.addToQueue(message);
    }

    /**
     * Send all queued server messages
     *
     * @memberof NetworkSendingSubsystem
     */
    public sendMessages() {
        this._serverMessageBroadcaster.sendMessages();
    }

    public setNetworkerSenders(networkers: Networker[]) {
        networkers.forEach((networker) =>
            networker.onServerMessageSend = (msg) => this._serverMessageBroadcaster.addToQueue(msg)
        );
    }
}
