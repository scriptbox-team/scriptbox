import Client from "core/client";
import NetEventHandler from "networking/net-event-handler";
import Networker from "networking/networker";
import ClientConnectionPacket from "networking/packets/client-connection-packet";
import ClientDisconnectPacket from "networking/packets/client-disconnect-packet";
import ClientEntityCreationPacket from "networking/packets/client-entity-creation-packet";
import ClientEntityDeletionPacket from "networking/packets/client-entity-deletion-packet";
import ClientEntityInspectionPacket from "networking/packets/client-entity-inspection-packet";
import ClientExecuteScriptPacket from "networking/packets/client-execute-script-packet";
import ClientKeyboardInputPacket from "networking/packets/client-keyboard-input-packet";
import ClientModifyComponentMetaPacket from "networking/packets/client-modify-component-meta-packet";
import ClientPrefabCreationPacket from "networking/packets/client-prefab-creation-packet";
import ClientRemoveComponentPacket from "networking/packets/client-remove-component-packet";
import ClientSetComponentEnableStatePacket from "networking/packets/client-set-component-enable-state-packet";
import ClientSetControlPacket from "networking/packets/client-set-control-packet";

import GameSystem from "./game-system";

/**
 * Interfaces between GameSystem and the networking components of the program.
 * This takes incoming packets and calls the associated functions in the system, and receives
 * callbacks from GameSystem to send outgoing packets.
 *
 * @export
 * @class GameSystemNetworker
 * @extends {Networker}
 * @module core
 */
export default class GameSystemNetworker extends Networker {
    private _gameSystem: GameSystem;
    /**
     * Creates an instance of GameSystemNetworker.
     * @param {GameSystem} gameSystem
     * @memberof GameSystemNetworker
     */
    constructor(gameSystem: GameSystem) {
        super();
        this.playerConnectionDelegate = this.playerConnectionDelegate.bind(this);
        this.playerDisconnectDelegate = this.playerDisconnectDelegate.bind(this);
        this.playerInputDelegate = this.playerInputDelegate.bind(this);
        this.entityCreationDelegate = this.entityCreationDelegate.bind(this);
        this.entityDeletionDelegate = this.entityDeletionDelegate.bind(this);
        this.entityInspectionDelegate = this.entityInspectionDelegate.bind(this);
        this.removeComponentDelegate = this.removeComponentDelegate.bind(this);
        this.executeScriptDelegate = this.executeScriptDelegate.bind(this);
        this.entitySetControlDelegate = this.entitySetControlDelegate.bind(this);
        this.setComponentEnableState = this.setComponentEnableState.bind(this);
        this.modifyComponentMetaDelegate = this.modifyComponentMetaDelegate.bind(this);
        this.prefabCreationDelegate = this.prefabCreationDelegate.bind(this);
        this._gameSystem = gameSystem;
    }
    /**
     * Adds input delegates to a NetEventHandler
     * @param {NetEventHandler} netEventHandler the NetEventHandler to add the delegates to.
     * @memberof GameSystemNetworker
     */
    public hookupInput(netEventHandler: NetEventHandler) {
        netEventHandler.addConnectionDelegate(this.playerConnectionDelegate);
        netEventHandler.addDisconnectionDelegate(this.playerDisconnectDelegate);
        netEventHandler.addEntityCreationDelegate(this.entityCreationDelegate);
        netEventHandler.addEntityDeletionDelegate(this.entityDeletionDelegate);
        netEventHandler.addEntityInspectionDelegate(this.entityInspectionDelegate);
        netEventHandler.addRemoveComponentDelegate(this.removeComponentDelegate);
        netEventHandler.addInputDelegate(this.playerInputDelegate);
        netEventHandler.addExecuteScriptDelegate(this.executeScriptDelegate);
        netEventHandler.addSetControlDelegate(this.entitySetControlDelegate);
        netEventHandler.addSetComponentEnableStateDelegate(this.setComponentEnableState);
        netEventHandler.addModifyComponentMetaDelegate(this.modifyComponentMetaDelegate);
        netEventHandler.addPrefabCreationDelegate(this.prefabCreationDelegate);
    }
    /**
     * A delegate which tells the GameSystem to create a player when a client connection is received.
     * @param {ClientConnectionPacket} packet The connection packet
     * @param {Client} player The client of the connection packet
     * @memberof DisplaySystemNetworker
     */
    public playerConnectionDelegate(packet: ClientConnectionPacket, client: Client) {
        this._gameSystem.createPlayer(client);
    }
    /**
     * A delegate which tells the GameSystem to remove a player when a client disconnection is received.
     *
     * @param {ClientDisconnectPacket} packet The disconnection packet
     * @param {Client} player The client of the disconnection packet
     * @memberof DisplaySystemNetworker
     */
    public playerDisconnectDelegate(packet: ClientDisconnectPacket, client: Client) {
        this._gameSystem.deletePlayer(client);
    }

    /**
     * A delegate which passes client input to the GameSystem
     *
     * @param {ClientKeyboardInputPacket} packet The input packet
     * @param {Client} client The client of the input packet
     * @memberof GameSystemNetworker
     */
    public playerInputDelegate(packet: ClientKeyboardInputPacket, client: Client) {
        this._gameSystem.handleKeyInput(packet.key, packet.state, client);
    }

    /**
     * A delegate which passes entity creation to the GameSystem
     *
     * @param {ClientEntityCreationPacket} packet The entity creation packet
     * @param {Client} client The client of the entity creation packet
     * @memberof GameSystemNetworker
     */
    public entityCreationDelegate(packet: ClientEntityCreationPacket, client: Client) {
        this._gameSystem.createEntityAt(packet.prefabID, packet.x, packet.y, client);
    }

    /**
     * A delegate which passes entity deletion to the GameSystem
     *
     * @param {ClientEntityDeletionPacket} packet The entity deletion packet
     * @param {Client} client The client of the entity deletion packet
     * @memberof GameSystemNetworker
     */
    public entityDeletionDelegate(packet: ClientEntityDeletionPacket, client: Client) {
        this._gameSystem.deleteEntity(packet.id);
    }

    /**
     * A delegate which passes entity inspection to the GameSystem
     *
     * @param {ClientEntityInspectionPacket} packet The entity inspection packet
     * @param {Client} client The client of the entity inspection packet
     * @memberof GameSystemNetworker
     */
    public entityInspectionDelegate(packet: ClientEntityInspectionPacket, client: Client) {
        this._gameSystem.setPlayerEntityInspection(client, packet.entityID);
    }

    /**
     * A delegate which passes component removal to the GameSystem
     *
     * @param {ClientRemoveComponentPacket} packet The component removal packet
     * @param {Client} client The client of the component removal packet
     * @memberof GameSystemNetworker
     */
    public removeComponentDelegate(packet: ClientRemoveComponentPacket, client: Client) {
        this._gameSystem.removeComponent(packet.componentID);
    }

    /**
     * A delegate which passes control setting to the GameSystem
     *
     * @param {ClientSetControlPacket} packet The control setting packet
     * @param {Client} client The client of the control setting packet
     * @memberof GameSystemNetworker
     */
    public entitySetControlDelegate(packet: ClientSetControlPacket, client: Client) {
        this._gameSystem.setPlayerControl(client, packet.entityID);
    }

    /**
     * A delegate which passes component enable state setting to the GameSystem
     *
     * @param {ClientSetComponentEnableStatePacket} packet The component enable state setting packet
     * @param {Client} client The client of the component enable state setting packet
     * @memberof GameSystemNetworker
     */
    public setComponentEnableState(packet: ClientSetComponentEnableStatePacket, client: Client) {
        this._gameSystem.setComponentEnableState(packet.componentID, packet.enableState);
    }

    /**
     * A delegate which passes prefab creation to the GameSystem
     *
     * @param {ClientPrefabCreationPacket} packet The prefab creation packet
     * @param {Client} client The client of the prefab creation packet
     * @memberof GameSystemNetworker
     */
    public prefabCreationDelegate(packet: ClientPrefabCreationPacket, client: Client) {
        this._gameSystem.createPrefab(packet.id, client);
    }

    /**
     * A delegate which passes script execution to the GameSystem
     *
     * @param {ClientExecuteScriptPacket} packet The script execution packet
     * @param {Client} client The client of the script execution packet
     * @memberof GameSystemNetworker
     */
    public executeScriptDelegate(
            packet: ClientExecuteScriptPacket, client: Client) {
        this._gameSystem.runResourcePlayerScript(packet.script, packet.args, client, packet.entityID);
    }

    /**
     * A delegate which passes component meta modification to the GameSystem
     *
     * @param {ClientModifyComponentMetaPacket} packet The component meta modification packet
     * @param {Client} client The client of the component meta modification packet
     * @memberof GameSystemNetworker
     */
    public modifyComponentMetaDelegate(packet: ClientModifyComponentMetaPacket, client: Client) {
        this._gameSystem.changeComponentMeta(packet.componentID, packet.property, packet.value);
    }
}
