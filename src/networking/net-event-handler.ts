import Player from "core/player";
import ClientConnectionPacket from "networking/packets/client-connection-packet";
import ClientDisconnectPacket from "networking/packets/client-disconnect-packet";
import ClientKeyboardInputPacket from "networking/packets/client-keyboard-input-packet";
import Packet from "networking/packets/packet";
import ClientNetEvent, { ClientEventType } from "./client-net-event";
import ClientAddComponentPacket from "./packets/client-add-component-packet";
import ClientChatMessagePacket from "./packets/client-chat-message-packet";
import ClientEditComponentPacket from "./packets/client-edit-component-packet";
import ClientExecuteScriptPacket from "./packets/client-execute-script-packet";
import ClientKeybindsPacket from "./packets/client-keybinds-packet";
import ClientModifyMetadataPacket from "./packets/client-modify-metadata-packet";
import ClientObjectCreationPacket from "./packets/client-object-creation-packet";
import ClientObjectDeletionPacket from "./packets/client-object-deletion-packet";
import ClientRemoveComponentPacket from "./packets/client-remove-component-packet";
import ClientTokenRequestPacket from "./packets/client-token-request-packet";
import ClientWatchEntityPacket from "./packets/client-watch-entity-packet";
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
    private _connectionDelegates: Array<(packet: ClientConnectionPacket, player: Player) => void>;
    private _disconnectionDelgates: Array<(packet: ClientDisconnectPacket, player: Player) => void>;
    private _inputDelegates: Array<(packet: ClientKeyboardInputPacket, player: Player) => void>;
    private _chatMessageDelegates: Array<(packet: ClientChatMessagePacket, player: Player) => void>;
    private _objectCreationDelegates: Array<(packet: ClientObjectCreationPacket, player: Player) => void>;
    private _objectDeletionDelegates: Array<(packet: ClientObjectDeletionPacket, player: Player) => void>;
    private _tokenRequestDelegates: Array<(packet: ClientTokenRequestPacket, player: Player) => void>;
    private _modifyMetadataDelegates: Array<(packet: ClientModifyMetadataPacket, player: Player) => void>;
    private _addComponentDelegates: Array<(packet: ClientAddComponentPacket, player: Player) => void>;
    private _removeComponentDelegates: Array<(packet: ClientRemoveComponentPacket, player: Player) => void>;
    private _editComponentDelegates: Array<(packet: ClientEditComponentPacket, player: Player) => void>;
    private _executeScriptDelegates: Array<(packet: ClientExecuteScriptPacket, player: Player) => void>;
    private _keybindingDelegates: Array<(packet: ClientKeybindsPacket, player: Player) => void>;
    private _watchEntityDelegates: Array<(packet: ClientWatchEntityPacket, player: Player) => void>;
    private _playerNetworkManager: PlayerNetworkManager;

    /**
     * Creates an instance of NetEventHandler.
     * @param {PlayerNetworkManager} playerNetworkManager The PlayerNetworkManager to take in
     * @memberof NetEventHandler
     */
    constructor(playerNetworkManager: PlayerNetworkManager) {
        this._playerNetworkManager = playerNetworkManager;
        this._connectionDelegates = new Array<(packet: ClientConnectionPacket, player: Player) => void>();
        this._disconnectionDelgates = new Array<(packet: ClientDisconnectPacket, player: Player) => void>();
        this._inputDelegates = new Array<(packet: ClientKeyboardInputPacket, player: Player) => void>();
        this._chatMessageDelegates = new Array<(packet: ClientChatMessagePacket, player: Player) => void>();
        this._objectCreationDelegates = new Array<(packet: ClientObjectCreationPacket, player: Player) => void>();
        this._objectDeletionDelegates = new Array<(packet: ClientObjectDeletionPacket, player: Player) => void>();
        this._tokenRequestDelegates = new Array<(packet: ClientTokenRequestPacket, player: Player) => void>();
        this._modifyMetadataDelegates = new Array<(packet: ClientModifyMetadataPacket, player: Player) => void>();
        this._addComponentDelegates = new Array<(packet: ClientAddComponentPacket, player: Player) => void>();
        this._removeComponentDelegates = new Array<(packet: ClientRemoveComponentPacket, player: Player) => void>();
        this._editComponentDelegates = new Array<(packet: ClientEditComponentPacket, player: Player) => void>();
        this._executeScriptDelegates = new Array<(packet: ClientExecuteScriptPacket, player: Player) => void>();
        this._keybindingDelegates = new Array<(packet: ClientKeybindsPacket, player: Player) => void>();
        this._watchEntityDelegates = new Array<(packet: ClientWatchEntityPacket, player: Player) => void>();

    }
    /**
     * Add a delegate for when a client connects.
     *
     * @param {((packet: ClientConnectionPacket, player: Player | undefined) => void)} func
     * The delegate to run when a client connects.
     * @memberof NetEventHandler
     */
    public addConnectionDelegate(func: (packet: ClientConnectionPacket, player: Player) => void) {
        this._connectionDelegates.push(func);
    }
    /**
     * Add a delegate for when a client disconnects.
     *
     * @param {((packet: ClientDisconnectPacket, player: Player | undefined) => void)} func
     * The delegate to run when a client disconnects
     * @memberof NetEventHandler
     */
    public addDisconnectionDelegate(func: (packet: ClientDisconnectPacket, player: Player) => void) {
        this._disconnectionDelgates.push(func);
    }
    /**
     * Add a delegate for when a client makes an input
     *
     * @param {((packet: ClientKeyboardInputPacket, player: Player | undefined) => void)} func
     * The delegate to run when a player performs an input
     * @memberof NetEventHandler
     */
    public addInputDelegate(func: (packet: ClientKeyboardInputPacket, player: Player) => void) {
        this._inputDelegates.push(func);
    }

    public addChatMessageDelegate(func: (packet: ClientChatMessagePacket, player: Player) => void) {
        this._chatMessageDelegates.push(func);
    }

    public addObjectCreationDelegate(func: (packet: ClientObjectCreationPacket, player: Player) => void) {
        this._objectCreationDelegates.push(func);
    }

    public addObjectDeletionDelegate(func: (packet: ClientObjectDeletionPacket, player: Player) => void) {
        this._objectDeletionDelegates.push(func);
    }

    public addTokenRequestDelegate(func: (packet: ClientTokenRequestPacket, playeR: Player) => void) {
        this._tokenRequestDelegates.push(func);
    }

    public addModifyMetadataDelegate(func: (packet: ClientModifyMetadataPacket, player: Player) => void) {
        this._modifyMetadataDelegates.push(func);
    }

    public addAddComponentDelegate(func: (packet: ClientAddComponentPacket, player: Player) => void) {
        this._addComponentDelegates.push(func);
    }

    public addRemoveComponentDelegate(func: (packet: ClientRemoveComponentPacket, player: Player) => void) {
        this._removeComponentDelegates.push(func);
    }

    public addEditComponentDelegate(func: (packet: ClientEditComponentPacket, player: Player) => void) {
        this._editComponentDelegates.push(func);
    }

    public addExecuteScriptDelegate(func: (packet: ClientExecuteScriptPacket, player: Player) => void) {
        this._executeScriptDelegates.push(func);
    }

    public addKeybindingDelegate(func: (packet: ClientKeybindsPacket, player: Player) => void) {
        this._keybindingDelegates.push(func);
    }

    public addWatchEntityDelegate(func: (packet: ClientWatchEntityPacket, player: Player) => void) {
        this._watchEntityDelegates.push(func);
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
                    if (player !== undefined) {
                        this.sendToDelegates(
                            data,
                            player,
                            this._disconnectionDelgates
                        );
                    }
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
            case ClientEventType.ObjectCreation: {
                this.sendToDelegates(
                    ClientObjectCreationPacket.deserialize(event.data),
                    this._playerNetworkManager.getPlayerFromConnectionID(connectionID),
                    this._objectCreationDelegates
                );
                break;
            }
            case ClientEventType.ObjectDeletion: {
                this.sendToDelegates(
                    ClientObjectDeletionPacket.deserialize(event.data),
                    this._playerNetworkManager.getPlayerFromConnectionID(connectionID),
                    this._objectDeletionDelegates
                );
                break;
            }
            case ClientEventType.TokenRequest: {
                this.sendToDelegates(
                    ClientTokenRequestPacket.deserialize(event.data),
                    this._playerNetworkManager.getPlayerFromConnectionID(connectionID),
                    this._tokenRequestDelegates
                );
                break;
            }
            case ClientEventType.ModifyMetadata: {
                this.sendToDelegates(
                    ClientModifyMetadataPacket.deserialize(event.data),
                    this._playerNetworkManager.getPlayerFromConnectionID(connectionID),
                    this._modifyMetadataDelegates
                );
                break;
            }
            case ClientEventType.AddComponent: {
                this.sendToDelegates(
                    ClientAddComponentPacket.deserialize(event.data),
                    this._playerNetworkManager.getPlayerFromConnectionID(connectionID),
                    this._addComponentDelegates
                );
                break;
            }
            case ClientEventType.RemoveComponent: {
                this.sendToDelegates(
                    ClientRemoveComponentPacket.deserialize(event.data),
                    this._playerNetworkManager.getPlayerFromConnectionID(connectionID),
                    this._removeComponentDelegates
                );
                break;
            }
            case ClientEventType.EditComponent: {
                this.sendToDelegates(
                    ClientEditComponentPacket.deserialize(event.data),
                    this._playerNetworkManager.getPlayerFromConnectionID(connectionID),
                    this._editComponentDelegates
                );
                break;
            }
            case ClientEventType.ExecuteScript: {
                this.sendToDelegates(
                    ClientExecuteScriptPacket.deserialize(event.data),
                    this._playerNetworkManager.getPlayerFromConnectionID(connectionID),
                    this._executeScriptDelegates
                );
                break;
            }
            case ClientEventType.Keybinds: {
                this.sendToDelegates(
                    ClientKeybindsPacket.deserialize(event.data),
                    this._playerNetworkManager.getPlayerFromConnectionID(connectionID),
                    this._keybindingDelegates
                );
                break;
            }
            case ClientEventType.WatchEntity: {
                this.sendToDelegates(
                    ClientWatchEntityPacket.deserialize(event.data),
                    this._playerNetworkManager.getPlayerFromConnectionID(connectionID),
                    this._watchEntityDelegates
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
     * @param {(Array<(packet: T, player: Player) => void>)} delegates The delegates to send to
     * @memberof NetEventHandler
     */
    private sendToDelegates<T extends Packet>(
        packet: T | undefined,
        player: Player | undefined,
        delegates: Array<(packet: T, player: Player) => void>,
    ) {
        if (packet !== undefined && player !== undefined) {
            for (const f of delegates) {
                f(packet, player);
            }
        }
    }
}
