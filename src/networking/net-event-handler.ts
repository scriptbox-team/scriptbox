import Player from "core/players/player";
import ClientConnectionPacket from "networking/packets/client-connection-packet";
import ClientDisconnectPacket from "networking/packets/client-disconnect-packet";
import ClientKeyboardInputPacket from "networking/packets/client-keyboard-input-packet";
import Packet from "networking/packets/packet";
import ClientNetEvent, { ClientEventType } from "./client-net-event";
import ClientChatMessagePacket from "./packets/client-chat-message-packet";
import PlayerNetworkManager from "./player-network-manager";

/**
 * A class that takes in ClientNetEvents and accordingly serializes and routes them based on type.
 * This class uses delegates to determine where packets should go.
 * It requires a PlayerNetworkManager to link client IDs to player IDs
 *
 * @export
 * @class NetEventHandler
 */
export default class NetEventHandler {
    public playerCreate?: (packet: ClientConnectionPacket) => Player;
    public playerRemove?: (packet: ClientDisconnectPacket, player: Player | undefined) => void;
    private _connectionDelegates: Array<(packet: ClientConnectionPacket, player: Player | undefined) => void>;
    private _disconnectionDelgates: Array<(packet: ClientDisconnectPacket, player: Player | undefined) => void>;
    private _inputDelegates: Array<(packet: ClientKeyboardInputPacket, player: Player | undefined) => void>;
    private _chatMessageDelegates: Array<(packet: ClientChatMessagePacket, player: Player | undefined) => void>;
    private _playerNetworkManager: PlayerNetworkManager;

    /**
     * Creates an instance of NetEventHandler.
     * @param {PlayerNetworkManager} playerNetworkManager The PlayerNetworkManager to take in
     * @memberof NetEventHandler
     */
    constructor(playerNetworkManager: PlayerNetworkManager) {
        this._playerNetworkManager = playerNetworkManager;
        this._connectionDelegates = new Array<(packet: ClientConnectionPacket, player: Player | undefined) => void>();
        this._disconnectionDelgates = new Array<(packet: ClientDisconnectPacket, player: Player | undefined) => void>();
        this._inputDelegates = new Array<(packet: ClientKeyboardInputPacket, player: Player | undefined) => void>();
        this._chatMessageDelegates = new Array<(packet: ClientChatMessagePacket, player: Player | undefined) => void>();
    }
    /**
     * Add a delegate for when a client connects.
     *
     * @param {((packet: ClientConnectionPacket, player: Player | undefined) => void)} func
     * The delegate to run when a client connects.
     * @memberof NetEventHandler
     */
    public addConnectionDelegate(func: (packet: ClientConnectionPacket, player: Player | undefined) => void) {
        this._connectionDelegates.push(func);
    }
    /**
     * Add a delegate for when a client disconnects.
     *
     * @param {((packet: ClientDisconnectPacket, player: Player | undefined) => void)} func
     * The delegate to run when a client disconnects
     * @memberof NetEventHandler
     */
    public addDisconnectionDelegate(func: (packet: ClientDisconnectPacket, player: Player | undefined) => void) {
        this._disconnectionDelgates.push(func);
    }
    /**
     * Add a delegate for when a client makes an input
     *
     * @param {((packet: ClientKeyboardInputPacket, player: Player | undefined) => void)} func
     * The delegate to run when a player performs an input
     * @memberof NetEventHandler
     */
    public addInputDelegate(func: (packet: ClientKeyboardInputPacket, player: Player | undefined) => void) {
        this._inputDelegates.push(func);
    }

    public addChatMessageDelegate(func: (packet: ClientChatMessagePacket, player: Player | undefined) => void) {
        this._chatMessageDelegates.push(func);
    }
    /**
     * Handles a ClientNetEvent, deserializing it and routing it to the correct delegate.
     *
     * @param {number} connectionID The connection the event came from
     * @param {ClientNetEvent} event The net event to deserialize and route
     * @memberof NetEventHandler
     */
    public handle(connectionID: number, event: ClientNetEvent) {
        switch (event.type) {
            case ClientEventType.Connection: {
                const data = ClientConnectionPacket.deserialize(event.data);
                if (data !== undefined) {
                    const player = this.playerCreate!(data);
                    this.sendToDelegates(
                        data,
                        player,
                        this._connectionDelegates
                    );
                }
                break;
            }
            case ClientEventType.Disconnect: {
                const data = ClientDisconnectPacket.deserialize(event.data);
                if (data !== undefined) {
                    const player = this._playerNetworkManager.getPlayerFromConnectionID(connectionID);
                    this.sendToDelegates(
                        data,
                        player,
                        this._disconnectionDelgates
                    );
                    this.playerRemove!(data, player);
                }
                break;
            }
            case ClientEventType.Input: {
                this.sendToDelegates(
                    ClientKeyboardInputPacket.deserialize(event.data),
                    this._playerNetworkManager.getPlayerFromConnectionID(connectionID),
                    this._inputDelegates
                );
                break;
            }
            case ClientEventType.ChatMessage: {
                this.sendToDelegates(
                    ClientChatMessagePacket.deserialize(event.data),
                    this._playerNetworkManager.getPlayerFromConnectionID(connectionID),
                    this._chatMessageDelegates
                );
                break;
            }
        }
    }
    /**
     * Send a packet to a set of delegates associated with its type.
     *
     * @private
     * @template T The type of the packet
     * @param {(T | undefined)} packet The packet to send
     * @param {(Player | undefined)} player The player associated with the packet
     * @param {(Array<(packet: T, player: Player | undefined) => void>)} delegates The delegates to send to
     * @memberof NetEventHandler
     */
    private sendToDelegates<T extends Packet>(
        packet: T | undefined,
        player: Player | undefined,
        delegates: Array<(packet: T, player: Player | undefined) => void>,
    ) {
        if (packet !== undefined) {
            for (const f of delegates) {
                f(packet, player);
            }
        }
    }
}
