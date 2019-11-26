import Client from "core/client";
import ClientConnectionPacket from "networking/packets/client-connection-packet";
import ClientDisconnectPacket from "networking/packets/client-disconnect-packet";
import ClientKeyboardInputPacket from "networking/packets/client-keyboard-input-packet";
import Packet from "networking/packets/packet";

import ClientNetEvent, { ClientEventType } from "./client-net-event";
import ClientAddComponentPacket from "./packets/client-add-component-packet";
import ClientChatMessagePacket from "./packets/client-chat-message-packet";
import ClientCloneResourcePacket from "./packets/client-clone-resource-packet";
import ClientEditComponentPacket from "./packets/client-edit-component-packet";
import ClientEditScriptPacket from "./packets/client-edit-script-packet";
import ClientEntityCreationPacket from "./packets/client-entity-creation-packet";
import ClientEntityDeletionPacket from "./packets/client-entity-deletion-packet";
import ClientEntityInspectionPacket from "./packets/client-entity-inspection-packet";
import ClientExecuteScriptPacket from "./packets/client-execute-script-packet";
import ClientKeybindsPacket from "./packets/client-keybinds-packet";
import ClientModifyComponentMetaPacket from "./packets/client-modify-component-meta-packet";
import ClientModifyMetadataPacket from "./packets/client-modify-metadata-packet";
import ClientPrefabCreationPacket from "./packets/client-prefab-creation-packet";
import ClientRemoveComponentPacket from "./packets/client-remove-component-packet";
import ClientRequestEditScriptPacket from "./packets/client-request-edit-script-packet";
import ClientSearchResourceRepoPacket from "./packets/client-search-resource-repo-packet";
import ClientSetComponentEnableStatePacket from "./packets/client-set-component-enable-state-packet";
import ClientSetControlPacket from "./packets/client-set-control-packet";
import ClientTokenRequestPacket from "./packets/client-token-request-packet";

/**
 * A class that takes in ClientNetEvents and accordingly serializes and routes them based on type.
 * This class uses delegates to determine where packets should go.
 * It requires a PlayerNetworkManager to link client IDs to player IDs
 *
 * @export
 * @class NetEventHandler
 */
export default class NetEventHandler {
    public playerCreate?: (connectionID: number, packet: ClientConnectionPacket) => Client;
    public playerRemove?: (packet: ClientDisconnectPacket, player: Client) => void;
    private _connectionDelegates: Array<(packet: ClientConnectionPacket, player: Client) => void>;
    private _disconnectionDelgates: Array<(packet: ClientDisconnectPacket, player: Client) => void>;
    private _inputDelegates: Array<(packet: ClientKeyboardInputPacket, player: Client) => void>;
    private _chatMessageDelegates: Array<(packet: ClientChatMessagePacket, player: Client) => void>;
    private _entityCreationDelegates: Array<(packet: ClientEntityCreationPacket, player: Client) => void>;
    private _entityDeletionDelegates: Array<(packet: ClientEntityDeletionPacket, player: Client) => void>;
    private _tokenRequestDelegates: Array<(packet: ClientTokenRequestPacket, player: Client) => void>;
    private _modifyMetadataDelegates: Array<(packet: ClientModifyMetadataPacket, player: Client) => void>;
    private _addComponentDelegates: Array<(packet: ClientAddComponentPacket, player: Client) => void>;
    private _removeComponentDelegates: Array<(packet: ClientRemoveComponentPacket, player: Client) => void>;
    private _editComponentDelegates: Array<(packet: ClientEditComponentPacket, player: Client) => void>;
    private _executeScriptDelegates: Array<(packet: ClientExecuteScriptPacket, player: Client) => void>;
    private _keybindingDelegates: Array<(packet: ClientKeybindsPacket, player: Client) => void>;
    private _entityInspectionDelegates: Array<(packet: ClientEntityInspectionPacket, player: Client) => void>;
    private _setControlDelegates: Array<(packet: ClientSetControlPacket, player: Client) => void>;
    private _setComponentEnableStateDelegates:
        Array<(packet: ClientSetComponentEnableStatePacket, player: Client) => void>;
    private _cloneResourceDelegates: Array<(packet: ClientCloneResourcePacket, player: Client) => void>;
    private _searchResourceRepoDelegates: Array<(packet: ClientSearchResourceRepoPacket, player: Client) => void>;
    private _requestEditScriptDelegates: Array<(packet: ClientRequestEditScriptPacket, player: Client) => void>;
    private _editScriptDelegates: Array<(packet: ClientEditScriptPacket, player: Client) => void>;
    private _modifyComponentMetaDelegates:
        Array<(packet: ClientModifyComponentMetaPacket, player: Client) => void>;
    private _prefabCreationDelegates: Array<(packet: ClientPrefabCreationPacket, player: Client) => void>;
    private _connectionIDToPlayer: Map<number, Client> = new Map<number, Client>();
    /**
     * Creates an instance of NetEventHandler.
     * @param {PlayerNetworkManager} playerNetworkManager The PlayerNetworkManager to take in
     * @memberof NetEventHandler
     */
    constructor() {
        this._connectionDelegates = new Array<(packet: ClientConnectionPacket, player: Client) => void>();
        this._disconnectionDelgates = new Array<(packet: ClientDisconnectPacket, player: Client) => void>();
        this._inputDelegates = new Array<(packet: ClientKeyboardInputPacket, player: Client) => void>();
        this._chatMessageDelegates = new Array<(packet: ClientChatMessagePacket, player: Client) => void>();
        this._entityCreationDelegates = new Array<(packet: ClientEntityCreationPacket, player: Client) => void>();
        this._entityDeletionDelegates = new Array<(packet: ClientEntityDeletionPacket, player: Client) => void>();
        this._tokenRequestDelegates = new Array<(packet: ClientTokenRequestPacket, player: Client) => void>();
        this._modifyMetadataDelegates = new Array<(packet: ClientModifyMetadataPacket, player: Client) => void>();
        this._addComponentDelegates = new Array<(packet: ClientAddComponentPacket, player: Client) => void>();
        this._removeComponentDelegates = new Array<(packet: ClientRemoveComponentPacket, player: Client) => void>();
        this._editComponentDelegates = new Array<(packet: ClientEditComponentPacket, player: Client) => void>();
        this._executeScriptDelegates = new Array<(packet: ClientExecuteScriptPacket, player: Client) => void>();
        this._keybindingDelegates = new Array<(packet: ClientKeybindsPacket, player: Client) => void>();
        this._entityInspectionDelegates = new Array<(packet: ClientEntityInspectionPacket, player: Client) => void>();
        this._setControlDelegates = new Array<(packet: ClientSetControlPacket, player: Client) => void>();
        this._setComponentEnableStateDelegates
            = new Array<(packet: ClientSetComponentEnableStatePacket, player: Client) => void>();
        this._cloneResourceDelegates = new Array<(packet: ClientCloneResourcePacket, player: Client) => void>();
        this._searchResourceRepoDelegates
            = new Array<(packet: ClientSearchResourceRepoPacket, player: Client) => void>();
        this._requestEditScriptDelegates = new Array<(packet: ClientRequestEditScriptPacket, player: Client) => void>();
        this._editScriptDelegates = new Array<(packet: ClientEditScriptPacket, player: Client) => void>();
        this._modifyComponentMetaDelegates
            = new Array<(packet: ClientModifyComponentMetaPacket, player: Client) => void>();
        this._prefabCreationDelegates = new Array<(packet: ClientPrefabCreationPacket, player: Client) => void>();

    }
    /**
     * Add a delegate for when a client connects.
     *
     * @param {((packet: ClientConnectionPacket, player: Client | undefined) => void)} func
     * The delegate to run when a client connects.
     * @memberof NetEventHandler
     */
    public addConnectionDelegate(func: (packet: ClientConnectionPacket, player: Client) => void) {
        this._connectionDelegates.push(func);
    }
    /**
     * Add a delegate for when a client disconnects.
     *
     * @param {((packet: ClientDisconnectPacket, player: Client | undefined) => void)} func
     * The delegate to run when a client disconnects
     * @memberof NetEventHandler
     */
    public addDisconnectionDelegate(func: (packet: ClientDisconnectPacket, player: Client) => void) {
        this._disconnectionDelgates.push(func);
    }
    /**
     * Add a delegate for when a client makes an input
     *
     * @param {((packet: ClientKeyboardInputPacket, player: Client | undefined) => void)} func
     * The delegate to run when a player performs an input
     * @memberof NetEventHandler
     */
    public addInputDelegate(func: (packet: ClientKeyboardInputPacket, player: Client) => void) {
        this._inputDelegates.push(func);
    }

    public addChatMessageDelegate(func: (packet: ClientChatMessagePacket, player: Client) => void) {
        this._chatMessageDelegates.push(func);
    }

    public addEntityCreationDelegate(func: (packet: ClientEntityCreationPacket, player: Client) => void) {
        this._entityCreationDelegates.push(func);
    }

    public addEntityDeletionDelegate(func: (packet: ClientEntityDeletionPacket, player: Client) => void) {
        this._entityDeletionDelegates.push(func);
    }

    public addTokenRequestDelegate(func: (packet: ClientTokenRequestPacket, playeR: Client) => void) {
        this._tokenRequestDelegates.push(func);
    }

    public addModifyMetadataDelegate(func: (packet: ClientModifyMetadataPacket, player: Client) => void) {
        this._modifyMetadataDelegates.push(func);
    }

    public addAddComponentDelegate(func: (packet: ClientAddComponentPacket, player: Client) => void) {
        this._addComponentDelegates.push(func);
    }

    public addRemoveComponentDelegate(func: (packet: ClientRemoveComponentPacket, player: Client) => void) {
        this._removeComponentDelegates.push(func);
    }

    public addEditComponentDelegate(func: (packet: ClientEditComponentPacket, player: Client) => void) {
        this._editComponentDelegates.push(func);
    }

    public addExecuteScriptDelegate(func: (packet: ClientExecuteScriptPacket, player: Client) => void) {
        this._executeScriptDelegates.push(func);
    }

    public addKeybindingDelegate(func: (packet: ClientKeybindsPacket, player: Client) => void) {
        this._keybindingDelegates.push(func);
    }

    public addEntityInspectionDelegate(func: (packet: ClientEntityInspectionPacket, player: Client) => void) {
        this._entityInspectionDelegates.push(func);
    }

    public addSetControlDelegate(func: (packet: ClientSetControlPacket, player: Client) => void) {
        this._setControlDelegates.push(func);
    }

    public addSetComponentEnableStateDelegate(
            func: (packet: ClientSetComponentEnableStatePacket, player: Client) => void) {
        this._setComponentEnableStateDelegates.push(func);
    }
    public addCloneResourceDelegates(func: (packet: ClientCloneResourcePacket, player: Client) => void) {
        this._cloneResourceDelegates.push(func);
    }
    public addSearchResourceRepoDelegates(func: (packet: ClientSearchResourceRepoPacket, player: Client) => void) {
        this._searchResourceRepoDelegates.push(func);
    }
    public addRequestEditScriptDelegates(func: (packet: ClientRequestEditScriptPacket, player: Client) => void) {
        this._requestEditScriptDelegates.push(func);
    }
    public addEditScriptDelegates(func: (packet: ClientEditScriptPacket, player: Client) => void) {
        this._editScriptDelegates.push(func);
    }
    public addModifyComponentMetaDelegate(func: (packet: ClientModifyComponentMetaPacket, player: Client) => void) {
        this._modifyComponentMetaDelegates.push(func);
    }
    public addPrefabCreationDelegate(func: (packet: ClientPrefabCreationPacket, player: Client) => void) {
        this._prefabCreationDelegates.push(func);
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
                    const player = this.playerCreate!(connectionID, data);
                    this._connectionIDToPlayer.set(connectionID, player);
                    this._sendToDelegates(
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
                    const player = this._getPlayerFromConnectionID(connectionID);
                    if (player !== undefined) {
                        this._sendToDelegates(
                            data,
                            player,
                            this._disconnectionDelgates
                        );
                        this.playerRemove!(data, player);
                        this._connectionIDToPlayer.delete(connectionID);
                    }
                }
                break;
            }
            case ClientEventType.Input: {
                this._sendToDelegates(
                    ClientKeyboardInputPacket.deserialize(event.data),
                    this._getPlayerFromConnectionID(connectionID),
                    this._inputDelegates
                );
                break;
            }
            case ClientEventType.ChatMessage: {
                this._sendToDelegates(
                    ClientChatMessagePacket.deserialize(event.data),
                    this._getPlayerFromConnectionID(connectionID),
                    this._chatMessageDelegates
                );
                break;
            }
            case ClientEventType.EntityCreation: {
                this._sendToDelegates(
                    ClientEntityCreationPacket.deserialize(event.data),
                    this._getPlayerFromConnectionID(connectionID),
                    this._entityCreationDelegates
                );
                break;
            }
            case ClientEventType.EntityDeletion: {
                this._sendToDelegates(
                    ClientEntityDeletionPacket.deserialize(event.data),
                    this._getPlayerFromConnectionID(connectionID),
                    this._entityDeletionDelegates
                );
                break;
            }
            case ClientEventType.TokenRequest: {
                this._sendToDelegates(
                    ClientTokenRequestPacket.deserialize(event.data),
                    this._getPlayerFromConnectionID(connectionID),
                    this._tokenRequestDelegates
                );
                break;
            }
            case ClientEventType.ModifyMetadata: {
                this._sendToDelegates(
                    ClientModifyMetadataPacket.deserialize(event.data),
                    this._getPlayerFromConnectionID(connectionID),
                    this._modifyMetadataDelegates
                );
                break;
            }
            case ClientEventType.AddComponent: {
                this._sendToDelegates(
                    ClientAddComponentPacket.deserialize(event.data),
                    this._getPlayerFromConnectionID(connectionID),
                    this._addComponentDelegates
                );
                break;
            }
            case ClientEventType.RemoveComponent: {
                this._sendToDelegates(
                    ClientRemoveComponentPacket.deserialize(event.data),
                    this._getPlayerFromConnectionID(connectionID),
                    this._removeComponentDelegates
                );
                break;
            }
            case ClientEventType.EditComponent: {
                this._sendToDelegates(
                    ClientEditComponentPacket.deserialize(event.data),
                    this._getPlayerFromConnectionID(connectionID),
                    this._editComponentDelegates
                );
                break;
            }
            case ClientEventType.ExecuteScript: {
                this._sendToDelegates(
                    ClientExecuteScriptPacket.deserialize(event.data),
                    this._getPlayerFromConnectionID(connectionID),
                    this._executeScriptDelegates
                );
                break;
            }
            case ClientEventType.Keybinds: {
                this._sendToDelegates(
                    ClientKeybindsPacket.deserialize(event.data),
                    this._getPlayerFromConnectionID(connectionID),
                    this._keybindingDelegates
                );
                break;
            }
            case ClientEventType.EntityInspection: {
                this._sendToDelegates(
                    ClientEntityInspectionPacket.deserialize(event.data),
                    this._getPlayerFromConnectionID(connectionID),
                    this._entityInspectionDelegates
                );
                break;
            }
            case ClientEventType.SetControl: {
                this._sendToDelegates(
                    ClientSetControlPacket.deserialize(event.data),
                    this._getPlayerFromConnectionID(connectionID),
                    this._setControlDelegates
                );
                break;
            }
            case ClientEventType.SetComponentEnableState: {
                this._sendToDelegates(
                    ClientSetComponentEnableStatePacket.deserialize(event.data),
                    this._getPlayerFromConnectionID(connectionID),
                    this._setComponentEnableStateDelegates
                );
                break;
            }
            case ClientEventType.CloneResource: {
                this._sendToDelegates(
                    ClientCloneResourcePacket.deserialize(event.data),
                    this._getPlayerFromConnectionID(connectionID),
                    this._cloneResourceDelegates
                );
                break;
            }
            case ClientEventType.SearchResourceRepo: {
                this._sendToDelegates(
                    ClientSearchResourceRepoPacket.deserialize(event.data),
                    this._getPlayerFromConnectionID(connectionID),
                    this._searchResourceRepoDelegates
                );
                break;
            }
            case ClientEventType.RequestEditScript: {
                this._sendToDelegates(
                    ClientRequestEditScriptPacket.deserialize(event.data),
                    this._getPlayerFromConnectionID(connectionID),
                    this._requestEditScriptDelegates
                );
                break;
            }
            case ClientEventType.EditScript: {
                this._sendToDelegates(
                    ClientEditScriptPacket.deserialize(event.data),
                    this._getPlayerFromConnectionID(connectionID),
                    this._editScriptDelegates
                );
                break;
            }
            case ClientEventType.ModifyComponentMeta: {
                this._sendToDelegates(
                    ClientModifyComponentMetaPacket.deserialize(event.data),
                    this._getPlayerFromConnectionID(connectionID),
                    this._modifyComponentMetaDelegates
                );
                break;
            }
            case ClientEventType.CreatePrefab: {
                this._sendToDelegates(
                    ClientPrefabCreationPacket.deserialize(event.data),
                    this._getPlayerFromConnectionID(connectionID),
                    this._prefabCreationDelegates
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
     * @param {(Client | undefined)} player The player associated with the packet
     * @param {(Array<(packet: T, player: Client) => void>)} delegates The delegates to send to
     * @memberof NetEventHandler
     */
    private _sendToDelegates<T extends Packet>(
        packet: T | undefined,
        player: Client | undefined,
        delegates: Array<(packet: T, player: Client) => void>,
    ) {
        if (packet !== undefined && player !== undefined) {
            for (const f of delegates) {
                f(packet, player);
            }
        }
    }
    private _getPlayerFromConnectionID(connectionID: number) {
        return this._connectionIDToPlayer.get(connectionID);
    }
}
