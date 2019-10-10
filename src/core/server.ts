import _ from "lodash";
import NetworkSystem from "networking/network-system";

import GameLoop from "./game-loop";
import IDGenerator from "./id-generator";
import Manager from "./manager";
import Player from "./player";
import PlayerManagerNetworker from "./player-manager-networker";
import DisplaySystem from "./systems/display-system";
import DisplaySystemNetworker from "./systems/display-system-networker";
import GameSystem from "./systems/game-system";
import GameSystemNetworker from "./systems/game-system-networker";
import MessageSystem from "./systems/message-system";
import MessageSystemNetworker from "./systems/message-system-networker";
import ResourceSystem from "./systems/resource-system";
import ResourceSystemNetworker from "./systems/resource-system-networker";

// TODO: Refactor stuff out of Server and Game (Client-side)
// TODO: Make private functions begin with an underscore
// TODO: Convert variable/function names to be more consistent with terminology

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
    private _playerManager: Manager<Player>;
    private _playerManagerNetworker: PlayerManagerNetworker;

    private _usernameToPlayer: Map<string, Player>;

    private _networkSystem: NetworkSystem;
    private _messageSystem: MessageSystem;
    private _messageSystemNetworker: MessageSystemNetworker;
    private _displaySystem: DisplaySystem;
    private _displaySystemNetworker: DisplaySystemNetworker;
    private _resourceSystem: ResourceSystem;
    private _resourceSystemNetworker: ResourceSystemNetworker;
    private _gameSystem: GameSystem;
    private _gameSystemNetworker: GameSystemNetworker;
    private _idGenerator: IDGenerator;

    private _loop: GameLoop;
    /**
     * Creates the instance of the game server.
     * This does not start the server, but can be used to configure options before starting.
     * @param {IServerConstructorOptions} options
     * @memberof Server
     */
    constructor(options: IServerConstructorOptions) {
        this.tick = this.tick.bind(this);
        this.createPlayer = this.createPlayer.bind(this);
        this.deletePlayer = this.deletePlayer.bind(this);
        this._idGenerator = new IDGenerator(Math.random());

        this._tickRate = 60;
        if (options.tickRate !== undefined) {
            this._tickRate = options.tickRate;
        }
        this._playerManager = new Manager<Player>(this.createPlayer, this.deletePlayer);
        this._playerManagerNetworker = new PlayerManagerNetworker(this._playerManager, this._idGenerator);
        this._usernameToPlayer = new Map<string, Player>();

        this._networkSystem = new NetworkSystem(
            {maxPlayers: options.maxPlayers, port: options.port},
            this._playerManager
        );
        this._messageSystem = new MessageSystem();
        this._messageSystemNetworker = new MessageSystemNetworker(this._messageSystem);
        this._displaySystem = new DisplaySystem();
        this._displaySystemNetworker = new DisplaySystemNetworker(this._displaySystem);
        this._resourceSystem = new ResourceSystem(
            this._idGenerator,
            {
                serverPort: "7778",
                resourcePath: "./data/res/"
            }
        );
        this._resourceSystem.playerByUsername = (username) => this._usernameToPlayer.get(username);
        this._resourceSystemNetworker = new ResourceSystemNetworker(this._resourceSystem);
        this._gameSystem = new GameSystem();
        this._gameSystemNetworker = new GameSystemNetworker(this._gameSystem);
        this._gameSystem.loadScriptResource = (resource) => this._resourceSystem.loadTextResource(resource);

        this._networkSystem.hookup([
            this._playerManagerNetworker,
            this._gameSystemNetworker,
            this._resourceSystemNetworker,
            this._displaySystemNetworker,
            this._messageSystemNetworker
        ]);

        this._messageSystem.onScriptExecution(async (code: string, player: Player) => {
            return await this._gameSystem.runGenericPlayerScript(code, player);
        });

        this._resourceSystem.onPlayerListingUpdate = this._resourceSystemNetworker.onPlayerListing;
        this._loop = new GameLoop(this.tick, this._tickRate);
    }

    /**
     * Starts the server and opens it to new connections.
     *
     * @memberof Server
     */
    public start() {
        this._networkSystem.host();
        this._resourceSystem.host();
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
        try {
            const exportValues = this._gameSystem.update();
            exportValues.players = {};
            const playerEntries = this._playerManager.entries();
            for (const [id, player] of playerEntries) {
                exportValues.players[id] = player;
            }
            this._displaySystem.broadcastDisplay(exportValues);
            this._displaySystem.sendWatchedObjects(exportValues);

            if (exportValues.messages !== undefined) {
                this._messageSystem.sendChatMessages(exportValues.messages);
            }

            this._networkSystem.sendMessages();
            this._resourceSystem.deleteQueued();
            this._playerManager.deleteQueued();
        }
        catch (error) {
            console.log(error);
        }
    }
    private createPlayer(id: string, clientID: number, username: string, displayName: string) {
        const player = new Player(id, clientID, username, displayName);
        this._usernameToPlayer.set(username, player);
        return player;
    }
    private deletePlayer(player: Player) {
        this._usernameToPlayer.delete(player.username);
    }
}
