import EntityManager from "core/entities/entity-manager";
import PlayerManager from "core/players/player-manager";
import MessageSystem from "messaging/message-system";
import NetworkSystem from "networking/network-system";
import ClientConnectionPacket from "networking/packets/client-connection-packet";
import ClientDisconnectPacket from "networking/packets/client-disconnect-packet";
import ServerMessage from "networking/server-messages/server-message";
import GameLoop from "./game-loop";
import Player from "./players/player";

/**
 * The options for the server constructor.
 *
 * @interface IServerConstructorOptions
 */
interface IServerConstructorOptions {
    /**
     * The port to host the server on.
     *
     * @type {number}
     * @memberof IServerConstructorOptions
     */
    port: number;
    /**
     * The maximum number of players that can connect to the server.
     *
     * @type {number}
     * @memberof IServerConstructorOptions
     */
    maxPlayers?: number;
    /**
     * The tick rate of the server.
     *
     * @type {number}
     * @memberof IServerConstructorOptions
     */
    tickRate?: number;
}

/**
 * An object representing the game in its entirety
 * This is created when the server is launched.
 *
 * @export
 * @class Server
 */
export default class Server {
    private _tickRate: number;
    private _nPlayer: number;

    private _entityManager: EntityManager;
    private _playerManager: PlayerManager;
    private _messageSystem: MessageSystem;
    private _networkSystem: NetworkSystem;

    private _loop: GameLoop;
    /**
     * Creates the instance of the game server.
     * This does not start the server, but can be used to configure options before starting.
     * @param {IServerConstructorOptions} options
     * @memberof Server
     */
    constructor(options: IServerConstructorOptions) {
        this._tickRate = 60;
        this._nPlayer = 0;
        if (options.tickRate !== undefined) {
            this._tickRate = options.tickRate;
        }
        this._messageSystem = new MessageSystem();
        this._networkSystem = new NetworkSystem({maxPlayers: options.maxPlayers, port: options.port});
        this._playerManager = new PlayerManager();
        this._entityManager = new EntityManager();

        this._networkSystem.netEventHandler.playerCreate = (packet: ClientConnectionPacket) => {
            const player = this._playerManager.createPlayer({
                controllingEntity: null,
                name: "Epic Gamer " + this._nPlayer++
            });
            return player;
        };

        this._networkSystem.netEventHandler.playerRemove = (
                packet: ClientDisconnectPacket,
                player: Player | undefined) => {
            this._playerManager.removePlayer(player!);
        };

        this._networkSystem.netEventHandler.addConnectionDelegate((
                packet: ClientConnectionPacket,
                player: Player | undefined) => {
            console.log(player!.name, "connected.");
        });

        this._networkSystem.netEventHandler.addDisconnectionDelegate((
                packet: ClientDisconnectPacket,
                player: Player | undefined) => {
            console.log(player!.name, "disconnected.");
        });

        this._networkSystem.netEventHandler.addInputDelegate(this._messageSystem.inputDelegate);

        this._messageSystem.onMessageSend((s: ServerMessage) => {
            this._networkSystem.queue(s);
        });

        this._loop = new GameLoop(this.tick.bind(this), this._tickRate);
    }

    /**
     * Starts the server and opens it to new connections.
     *
     * @memberof Server
     */
    public start() {
        this._networkSystem.host();
        this._loop.start();
        console.log("Server started.");
    }

    /**
     * A set of actions performed every server tick.
     *
     * @private
     * @memberof Server
     */
    private tick() {
        this._networkSystem.sendMessages();
    }
}
