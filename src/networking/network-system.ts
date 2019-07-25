
import Player from "core/players/player";
import NetHost from "networking/net-host";
import ClientConnectionPacket from "networking/packets/client-connection-packet";
import PlayerNetworkManager from "networking/player-network-manager";
import NetworkReceivingSubsystem from "./network-receiving-subsystem";
import NetworkSendingSubsystem from "./network-sending-subsystem";
import ServerMessage from "./server-messages/server-message";

interface INetworkSystemConstructorOptions {
    port?: number;
    maxPlayers?: number;
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
    private _playerNetworkManager: PlayerNetworkManager;
    private _networkReceivingSubsystem: NetworkReceivingSubsystem;
    private _networkSendingSubsystem: NetworkSendingSubsystem;
    private _maxPlayers: number;
    private _port: number;
    /**
     * Creates an instance of NetworkSystem.
     * This does not open the network system to new connections.
     * @param {INetworkSystemConstructorOptions} options
     * @memberof NetworkSystem
     */
    constructor(options: INetworkSystemConstructorOptions) {
        this._maxPlayers = 8;
        this._port = 7777;

        if (options.maxPlayers !== undefined) {
            this._maxPlayers = options.maxPlayers;
        }
        if (options.port !== undefined) {
            this._port = options.port;
        }
        this._playerNetworkManager = new PlayerNetworkManager();
        this._netHost = new NetHost({port: this._port, maxClients: this._maxPlayers});

        this._networkReceivingSubsystem = new NetworkReceivingSubsystem(this._netHost, this._playerNetworkManager);
        this._networkSendingSubsystem = new NetworkSendingSubsystem(this._netHost, this._playerNetworkManager);

        this._networkReceivingSubsystem.netEventHandler.addConnectionDelegate(
            this._playerNetworkManager.connectionDelegate
        );

        this._networkReceivingSubsystem.netEventHandler.addDisconnectionDelegate(
            this._playerNetworkManager.disconnectionDelegate
        );
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

    /**
     * Get the NetEventHandler, which is used to route packets to delegates
     *
     * @readonly
     * @memberof NetworkSystem
     */
    get netEventHandler() {
        return this._networkReceivingSubsystem.netEventHandler;
    }
}
