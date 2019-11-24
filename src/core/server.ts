import Database from "database/database";
import _ from "lodash";
import NetworkSystem from "networking/network-system";
import path from "path";

import Client from "./client";
import ClientManagerNetworker from "./client-manager-networker";
import { MessageExportInfo } from "./export-values";
import GameLoop from "./game-loop";
import Group, { GroupType } from "./group";
import IDGenerator from "./id-generator";
import Manager from "./manager";
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
    resourcePort: number;
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
    private _clientManager: Manager<Client>;
    private _clientManagerNetworker: ClientManagerNetworker;

    private _usernameToPlayer: Map<string, Client>;

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
    private _database: Database;
    private _nextSave: number = 0;
    private _saveTime: number = 120000;

    private _loop: GameLoop;
    private _mapJustLoaded = false;
    /**
     * Creates the instance of the game server.
     * This does not start the server, but can be used to configure options before starting.
     * @param {IServerConstructorOptions} options
     * @memberof Server
     */
    constructor(options: IServerConstructorOptions) {
        this._tick = this._tick.bind(this);
        this._createPlayer = this._createPlayer.bind(this);
        this._deletePlayer = this._deletePlayer.bind(this);
        this._getResourceServerIP = this._getResourceServerIP.bind(this);

        this._database = new Database("mongodb://localhost:27017", [
            "resources",
            "game-objects",
            "game-references",
            "game-entity-references",
            "game-player-references",
            "game-component-info-references",
            "game-generated-chunks"
        ]);

        this._idGenerator = new IDGenerator(Math.random());

        this._tickRate = 60;
        if (options.tickRate !== undefined) {
            this._tickRate = options.tickRate;
        }
        this._clientManager = new Manager<Client>(this._createPlayer, this._deletePlayer);
        this._clientManagerNetworker = new ClientManagerNetworker(this._clientManager, this._idGenerator);
        this._usernameToPlayer = new Map<string, Client>();

        this._networkSystem = new NetworkSystem(
            {maxPlayers: options.maxPlayers, port: options.port, resourceServerIPGetter: this._getResourceServerIP},
            this._clientManager
        );
        this._messageSystem = new MessageSystem();
        this._messageSystemNetworker = new MessageSystemNetworker(this._messageSystem);
        this._displaySystem = new DisplaySystem();
        this._displaySystemNetworker = new DisplaySystemNetworker(this._displaySystem);
        this._resourceSystem = new ResourceSystem(
            this._idGenerator,
            this._database.getCollection("resources"),
            {
                serverPort: "" + options.resourcePort,
                resourcePath: "./data/res/"
            }
        );
        this._resourceSystem.playerByUsername = (username) => this._usernameToPlayer.get(username);
        this._resourceSystemNetworker = new ResourceSystemNetworker(this._resourceSystem);
        this._gameSystem = new GameSystem(
            this._tickRate,
            path.join(process.cwd(), "scripts"),
            [
                "export-values.ts",
                "object-serializer.ts",
                "proxy-generator.ts",
                "quadtree-grid.ts",
                "quadtree.ts",
                "scripted-server-subsystem.ts",
                "serialized-object-collection.ts"
            ],
            {
                objects: this._database.getCollection("game-objects"),
                references: this._database.getCollection("game-references"),
                entityReferences: this._database.getCollection("game-entity-references"),
                playerReferences: this._database.getCollection("game-player-references"),
                componentInfoReferences: this._database.getCollection("game-component-info-references")
            },
            this._database.getCollection("game-generated-chunks")
        );
        this._gameSystemNetworker = new GameSystemNetworker(this._gameSystem);
        this._gameSystem.getResourceByID = async (id) => await this._resourceSystem.getResourceByID(id);
        this._gameSystem.getPlayerResources = async (user) => await this._resourceSystem.getPlayerResources(user);
        this._gameSystem.loadResource = async (resource, enc) => await this._resourceSystem.loadResource(resource, enc);
        this._gameSystem.loadResourceSync = (resource, enc) => this._resourceSystem.loadResourceSync(resource, enc);
        this._gameSystem.addResources = async (scriptPaths: string[]) => {
            await this._resourceSystem.addDefaultCodeResources(scriptPaths);
        };

        this._networkSystem.hookup([
            this._clientManagerNetworker,
            this._gameSystemNetworker,
            this._resourceSystemNetworker,
            this._displaySystemNetworker,
            this._messageSystemNetworker
        ]);

        this._messageSystem.onScriptExecution(async (code: string, player: Client) => {
            return await this._gameSystem.runGenericPlayerScript(code, player);
        });

        this._resourceSystem.addPlayerListingDelegate(this._gameSystem.updateResources);

        this._loop = new GameLoop(this._tick, this._tickRate);

        this._database.connect()
            .then(async () => {
                try {
                    await this._resourceSystem.loadExistingResources(
                        path.join(process.cwd(), "./data/res"),
                        path.join(process.cwd(), "./data-default")
                    );
                    await this._gameSystem.loadDefaultCodeResources();
                }
                catch (err) {
                    console.error(err);
                    console.error("Resource loading failed.");
                }
                try {
                    await this._gameSystem.loadMap();
                    this._mapJustLoaded = true;
                }
                catch (err) {
                    console.error(err);
                    console.error("Map loading failed.");
                }
                this.start();
            });
    }

    /**
     * Starts the server and opens it to new connections.
     *
     * @memberof Server
     */
    public start() {
        this._nextSave = Date.now() + this._saveTime;
        this._networkSystem.host();
        this._resourceSystem.host();
        this._loop.start();
        console.log(`Server started on port ${this._networkSystem.port}`);
    }

    /**
     * A set of actions performed every server tick.
     *
     * @private
     * @memberof Server
     */
    private _tick() {
        try {
            const exportValues = this._gameSystem.update(this._mapJustLoaded);
            _.each(exportValues.players, (playerDataObj, id) => {
                playerDataObj.client = this._clientManager.get(id);
            });
            this._displaySystem.broadcastDisplay(exportValues);
            this._displaySystem.sendCameraData(exportValues);
            this._displaySystem.sendSoundData(exportValues);
            this._displaySystem.sendInspectedEntities(exportValues);

            if (exportValues.messages !== undefined) {
                const messages = exportValues.messages.map((msg: MessageExportInfo) => {
                    let group = new Group<Client>(
                        GroupType.Only,
                        msg.recipient.map((pID) => exportValues.players[pID].client)
                    );
                    if (msg.recipient.length === 0) {
                        group = new Group<Client>(
                            GroupType.All,
                            []
                        );
                    }
                    return {
                        message: msg.message,
                        kind: msg.kind,
                        recipient: group
                    };
                });
                this._messageSystem.sendChatMessages(messages);
            }
            this._resourceSystem.deleteQueued();
            this._clientManager.deleteQueued();

            if (Date.now() > this._nextSave) {
                this._gameSystem.saveMap();
                this._nextSave += this._saveTime;
            }

            this._mapJustLoaded = false;

        }
        catch (error) {
            // TODO: Suppress repeated errors
            this._messageSystem.broadcastMessage(`[GLOBAL] <${error.stack}>`);
            console.log(`[GLOBAL] <${error.stack}>`);
            this._gameSystem.recover();
        }
        finally {
            this._networkSystem.sendMessages();
        }
    }
    private _createPlayer(id: string, clientID: number, username: string, displayName: string) {
        const player = new Client(id, clientID, username, displayName);
        this._usernameToPlayer.set(username, player);
        return player;
    }
    private _deletePlayer(player: Client) {
        this._usernameToPlayer.delete(player.username);
    }
    private _getResourceServerIP(serverIP: string) {
        return `${serverIP}:${this._resourceSystem.port}`;
    }
}
