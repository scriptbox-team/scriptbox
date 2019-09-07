import PlayerManager from "core/players/player-manager";
import _ from "lodash";
import MessageSystem from "messaging/message-system";
import NetworkSystem from "networking/network-system";
import ClientChatMessagePacket from "networking/packets/client-chat-message-packet";
import ClientConnectionPacket from "networking/packets/client-connection-packet";
import ClientDisconnectPacket from "networking/packets/client-disconnect-packet";
import ClientExecuteScriptPacket from "networking/packets/client-execute-script-packet";
import ClientKeyboardInputPacket from "networking/packets/client-keyboard-input-packet";
import ClientObjectCreationPacket from "networking/packets/client-object-creation-packet";
import ClientObjectDeletionPacket from "networking/packets/client-object-deletion-packet";
import ClientTokenRequestPacket from "networking/packets/client-token-request-packet";
import ServerResourceListingPacket from "networking/packets/server-resource-listing-packet";
import ServerTokenPacket from "networking/packets/server-token-packet";
import ServerMessage from "networking/server-messages/server-message";
import { MessageRecipient, MessageRecipientType } from "networking/server-messages/server-message-recipient";
import ServerNetEvent, { ServerEventType } from "networking/server-net-event";
import TokenGenerator from "networking/token-generator";
import path from "path";
import DisplaySystem from "resource-management/display-system";
import Resource from "resource-management/resource";
import ResourceManager from "resource-management/resource-manager";
import IExports from "./export-values";
import GameLoop from "./game-loop";
import Player from "./players/player";
import ScriptwiseSystem from "./scriptwise-system";

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

    private _playerManager: PlayerManager;
    private _messageSystem: MessageSystem;
    private _networkSystem: NetworkSystem;
    private _displaySystem: DisplaySystem;
    private _scriptwiseSystem: ScriptwiseSystem;
    private _resourceManager: ResourceManager;
    private _exportValues: IExports;
    private _lastExportValues: IExports;

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
        this._displaySystem = new DisplaySystem();
        this._networkSystem = new NetworkSystem({maxPlayers: options.maxPlayers, port: options.port});
        this._playerManager = new PlayerManager();
        this._resourceManager = new ResourceManager(
            {
                serverPort: "7778",
                resourcePath: "./data/res/"
            }
        );

        this.addNetDelegates();

        this._messageSystem.onMessageSend((s: ServerMessage) => {
            this._networkSystem.queue(s);
        });

        this._messageSystem.onScriptExecution(async (code: string) => {
            return (await this._scriptwiseSystem.runPlayerScript(code, "")).result;
        });

        this._displaySystem.onObjectDisplay((s: ServerMessage) => {
            this._networkSystem.queue(s);
        });

        this._scriptwiseSystem = new ScriptwiseSystem(
            path.join(__dirname, "../__scripted__/"), [
                "./aspect.ts",
                "./entity-manager-interface.ts",
                "./entity-manager-module-interface.ts",
                "./entity-manager.ts",
                "./entity.ts",
                "./module.ts",
                "./position.ts",
                "./scripted-server-subsystem.ts",
                "./aspect.ts",
                "./control.ts",
                "./default-control.ts",
                "./aspect-array.ts",
                "./velocity.ts",
                "./collision-box.ts"
            ]
        );

        this._resourceManager.onPlayerListingUpdate = (username: string, resources: Resource[]) => {
            const player = this._playerManager.getPlayerByUsername(username);
            console.log(resources);
            if (player !== undefined) {
                this._networkSystem.queue(
                    new ServerMessage(
                        new ServerNetEvent(ServerEventType.ResourceListing, new ServerResourceListingPacket(resources)),
                        new MessageRecipient(MessageRecipientType.Only, [player])
                    )
                );
            }
        };

        this._exportValues = {
            entities: {}
        };
        this._lastExportValues = this._exportValues;

        this._loop = new GameLoop(this.tick.bind(this), this._tickRate);
    }

    /**
     * Starts the server and opens it to new connections.
     *
     * @memberof Server
     */
    public start() {
        this._networkSystem.host();
        this._resourceManager.host();
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
            this._scriptwiseSystem.execute("./scripted-server-subsystem", "update");

            this._lastExportValues = this._exportValues;
            this._exportValues = this._scriptwiseSystem.runPostScript("./scripted-server-subsystem",
            `
                new IVM.ExternalCopy(global.exportValues).copyInto();
            `).result;
            this._displaySystem.broadcastDisplayChanges(this._lastExportValues, this._exportValues);

            this._networkSystem.sendMessages();
        }
        catch (error) {
            console.log(error);
        }
    }

    private addNetDelegates() {
        this._networkSystem.netEventHandler.playerCreate = (packet: ClientConnectionPacket) => {
            const playerNum = this._nPlayer++;
            const name = "EpicGamer" + playerNum;
            const displayName = "Epic Gamer " + playerNum;
            const player = this._playerManager.createPlayer({
                controllingEntity: null,
                username: name,
                displayName
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
            console.log(player!.username, "connected.");
            this._messageSystem.broadcastMessage(player!.username + " connected.");
            const entID = this._scriptwiseSystem.execute("./scripted-server-subsystem", "createEntity");
            this._scriptwiseSystem.execute(
                "./scripted-server-subsystem",
                "createModule",
                entID,
                "position",
                "position",
                Math.random() * 150,
                Math.random() * 150
            );
            this._scriptwiseSystem.execute(
                "./scripted-server-subsystem",
                "createModule",
                entID,
                "velocity",
                "velocity",
                0,
                0
            );
            this._scriptwiseSystem.execute(
                "./scripted-server-subsystem",
                "createModule",
                entID,
                "default-control",
                "control"
            );
            player!.controllingEntity = entID;
            this._displaySystem.sendFullDisplayToPlayer(
                this._exportValues,
                player!
            );
        });

        this._networkSystem.netEventHandler.addDisconnectionDelegate((
                packet: ClientDisconnectPacket,
                player: Player) => {
            this._messageSystem.broadcastMessage(player!.username + " disconnected.");
            console.log(player!.username, "disconnected.");
        });

        this._networkSystem.netEventHandler.addInputDelegate(
                (packet: ClientKeyboardInputPacket, player: Player) => {
            const input = player!.convertInput(packet.key);
            this._scriptwiseSystem.execute(
                "./scripted-server-subsystem",
                "handleInput",
                player!.controllingEntity,
                input,
                packet.state
            );
        });

        this._networkSystem.netEventHandler.addChatMessageDelegate(
                (packet: ClientChatMessagePacket, player: Player) => {
            this._messageSystem.chatMessageDelegate(packet, player);
        });

        this._networkSystem.netEventHandler.addObjectCreationDelegate(
                (packet: ClientObjectCreationPacket, player: Player) => {
            const entID = this._scriptwiseSystem.execute("./scripted-server-subsystem", "createEntity");
            this._scriptwiseSystem.execute(
                "./scripted-server-subsystem",
                "createModule",
                entID,
                "position",
                "position",
                packet.x,
                packet.y
            );
        });

        this._networkSystem.netEventHandler.addObjectDeletionDelegate(
                (packet: ClientObjectDeletionPacket, player: Player) => {
            this._scriptwiseSystem.execute("./scripted-server-subsystem", "deleteEntity", packet.id);
        });

        this._networkSystem.netEventHandler.addTokenRequestDelegate(
                (packet: ClientTokenRequestPacket, player: Player) => {
            const token = TokenGenerator.makeToken();
            this._resourceManager.setPlayerToken(player!, token);
            this._networkSystem.queue(
                new ServerMessage(
                    new ServerNetEvent(ServerEventType.Token, new ServerTokenPacket(packet.tokenType, token)),
                    new MessageRecipient(MessageRecipientType.Only, [player!])
                )
            );
        });

        this._networkSystem.netEventHandler.addExecuteScriptDelegate(
                (packet: ClientExecuteScriptPacket, player: Player) => {
            const resource = this._resourceManager.getResourceByID(packet.script);
            if (resource === undefined) {
                return;
            }
            this._resourceManager.loadTextResource(packet.script)
                .then(async (code) => {
                    const script = await this._scriptwiseSystem.runPlayerScript(code, packet.args);
                    const defaultExport = script.getReference("default");
                    if (defaultExport !== undefined) {
                        this._scriptwiseSystem.execute(
                            "./scripted-server-subsystem",
                            "setModuleClass",
                            defaultExport.derefInto(),
                            packet.script
                        );
                    }
                    if (script.result !== undefined) {
                        this._messageSystem.sendMessageToPlayer(`Result: ${script.result}`, player);
                    }
                })
                .catch((err) => {
                    this._messageSystem.sendMessageToPlayer(`Error: ${err}`, player);
                });
        });
    }
}
