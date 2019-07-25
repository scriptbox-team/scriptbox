import PlayerManager from "core/players/player-manager";
import * as _ from "lodash";
import MessageSystem from "messaging/message-system";
import NetworkSystem from "networking/network-system";
import ClientConnectionPacket from "networking/packets/client-connection-packet";
import ClientDisconnectPacket from "networking/packets/client-disconnect-packet";
import ClientKeyboardInputPacket from "networking/packets/client-keyboard-input-packet";
import ServerMessage from "networking/server-messages/server-message";
import path from "path";
import DisplaySystem from "resource-management/display-system";
import Difference from "./difference";
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

interface IExports {
    positions: {[id: string]: {x: number, y: number}};
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
            this._displaySystem.onNewPlayer(this._exportValues.positions, player!);
        });

        this._networkSystem.netEventHandler.addDisconnectionDelegate((
                packet: ClientDisconnectPacket,
                player: Player | undefined) => {
            console.log(player!.name, "disconnected.");
        });

        this._networkSystem.netEventHandler.addInputDelegate(
                (packet: ClientKeyboardInputPacket, player: Player | undefined) => {
            const input = player!.convertInput(packet.key);
            console.log(packet);
            this._scriptwiseSystem.execute(
                "./scripted-server-subsystem",
                "handleInput",
                player!.controllingEntity,
                input,
                packet.state
            );
        });

        this._messageSystem.onMessageSend((s: ServerMessage) => {
            this._networkSystem.queue(s);
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
                "./velocity.ts"
            ]
        );

        this._exportValues = {
            positions: {}
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
            `);
            this._displaySystem.onChanges(this.getExportDifferences());

            this._networkSystem.sendMessages();
        }
        catch (error) {
            console.log("Error: " + error);
        }
    }

    private getExportDifferences() {
        // Lodash type annotations are really restrictive
        // So please ignore the following casting shenanigans
        const diffs = _.transform(this._exportValues.positions, (acc, value, key) => {
            const result = acc as any;
            const otherVal = this._lastExportValues.positions[key];
            if (otherVal === undefined) {
                result.added[key] = value;
            }
            else if (otherVal.x !== value.x || otherVal.y !== value.y) {
                result.updated[key] = value;
            }
        }, {added: {}, updated: {}, removed: {}}) as any as Difference<{x: number, y: number}>;
        _.each(this._lastExportValues.positions, (value, key) => {
            if (this._exportValues.positions[key] === undefined) {
                diffs.removed[key] = value;
            }
        });
        return diffs;
    }
}
