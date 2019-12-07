
import Client from "core/client";
import Manager from "core/manager";
import NetHost from "networking/net-host";
import Networker from "networking/networker";

import NetworkReceivingSubsystem from "./network-receiving-subsystem";
import NetworkSendingSubsystem from "./network-sending-subsystem";
import ServerMessage from "./server-messages/server-message";

interface NetworkSystemConstructorOptions {
    port?: number;
    maxPlayers?: number;
    loginValidationURL: string;
    useLoginServer: boolean;
    resourceServerIPGetter: () => string;
}

/**
 * A system dedicated to sending and receiving network messages between the server and clients.
 * This also uses delegates to route packets to other game systems.
 *
 * @export
 * @class NetworkSystem
 */
export default class NetworkSystem {
    private _netHost: NetHost;
    private _networkReceivingSubsystem: NetworkReceivingSubsystem;
    private _networkSendingSubsystem: NetworkSendingSubsystem;
    private _maxPlayers: number;
    private _port: number;
    /**
     * Creates an instance of NetworkSystem.
     * This does not open the network system to new connections.
     * @param {NetworkSystemConstructorOptions} options
     * @memberof NetworkSystem
     */
    constructor(options: NetworkSystemConstructorOptions, playerManager: Manager<Client>) {
        this._maxPlayers = 8;
        this._port = 7777;

        if (options.maxPlayers !== undefined) {
            this._maxPlayers = options.maxPlayers;
        }
        if (options.port !== undefined) {
            this._port = options.port;
        }

        this._netHost = new NetHost({port: this._port, maxClients: this._maxPlayers});
        this._netHost.resourceServerIPGetter = options.resourceServerIPGetter;

        this._networkReceivingSubsystem = new NetworkReceivingSubsystem(
            this._netHost,
            options.loginValidationURL,
            options.useLoginServer);
        this._networkSendingSubsystem = new NetworkSendingSubsystem(this._netHost, playerManager);
    }
    /**
     * Open the system to new connections
     *
     * @memberof NetworkSystem
     */
    public host() {
        this._netHost.start();
    }

    /**
     * Queue a server message to be sent to clients on the next tick
     *
     * @param {ServerMessage} message
     * @memberof NetworkSystem
     */
    public queue(message: ServerMessage) {
        this._networkSendingSubsystem.queue(message);
    }

    /**
     * Send all queued server messages
     *
     * @memberof NetworkSystem
     */
    public sendMessages() {
        this._networkSendingSubsystem.sendMessages();
    }

    public hookup(networkers: Networker[]) {
        this._networkReceivingSubsystem.hookupNetworkers(networkers);
        this._networkSendingSubsystem.setNetworkerSenders(networkers);
    }

    get port() {
        return this._port;
    }
}
