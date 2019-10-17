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
import ClientRemoveComponentPacket from "networking/packets/client-remove-component-packet";

import GameSystem from "./game-system";

export default class GameSystemNetworker extends Networker {
    private _gameSystem: GameSystem;
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
        this._gameSystem = gameSystem;
    }
    public hookupInput(netEventHandler: NetEventHandler) {
        netEventHandler.addConnectionDelegate(this.playerConnectionDelegate);
        netEventHandler.addDisconnectionDelegate(this.playerDisconnectDelegate);
        netEventHandler.addEntityCreationDelegate(this.entityCreationDelegate);
        netEventHandler.addEntityDeletionDelegate(this.entityDeletionDelegate);
        netEventHandler.addEntityInspectionDelegate(this.entityInspectionDelegate);
        netEventHandler.addRemoveComponentDelegate(this.removeComponentDelegate);
        netEventHandler.addInputDelegate(this.playerInputDelegate);
        netEventHandler.addExecuteScriptDelegate(this.executeScriptDelegate);
    }
    public playerConnectionDelegate(packet: ClientConnectionPacket, client: Client) {
        this._gameSystem.createPlayer(client);
    }
    public playerDisconnectDelegate(packet: ClientDisconnectPacket, client: Client) {
        this._gameSystem.setPlayerEntityInspection(client, undefined);
    }
    public playerInputDelegate(packet: ClientKeyboardInputPacket, client: Client) {
        this._gameSystem.handleKeyInput(packet.key, packet.state, client);
    }
    public entityCreationDelegate(packet: ClientEntityCreationPacket, client: Client) {
        this._gameSystem.createEntityAt(packet.prefabID, packet.x, packet.y, client);
    }
    public entityDeletionDelegate(packet: ClientEntityDeletionPacket, client: Client) {
        this._gameSystem.deleteEntity(packet.id);
    }
    public entityInspectionDelegate(packet: ClientEntityInspectionPacket, client: Client) {
        this._gameSystem.setPlayerEntityInspection(client, packet.entityID);
    }
    public removeComponentDelegate(packet: ClientRemoveComponentPacket, client: Client) {
        this._gameSystem.removeComponent(packet.componentID);
    }
    public entitySetControlDelegate(packet: ClientExecuteScriptPacket, client: Client) {
        this._gameSystem.setPlayerControl(client, packet.entityID);
    }
    public executeScriptDelegate(
            packet: ClientExecuteScriptPacket, client: Client) {
        this._gameSystem.runResourcePlayerScript(packet.script, packet.args, client, packet.entityID);
    }
}
