import Player from "core/player";
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
    public playerConnectionDelegate(packet: ClientConnectionPacket, player: Player) {
        this._gameSystem.createPlayer(player);
    }
    public playerDisconnectDelegate(packet: ClientDisconnectPacket, player: Player) {
        this._gameSystem.setPlayerEntityInspection(player, undefined);
    }
    public playerInputDelegate(packet: ClientKeyboardInputPacket, player: Player) {
        this._gameSystem.handleKeyInput(packet.key, packet.state, player);
    }
    public entityCreationDelegate(packet: ClientEntityCreationPacket, player: Player) {
        this._gameSystem.createEntityAt(packet.prefabID, packet.x, packet.y, player);
    }
    public entityDeletionDelegate(packet: ClientEntityDeletionPacket, player: Player) {
        this._gameSystem.deleteEntity(packet.id);
    }
    public entityInspectionDelegate(packet: ClientEntityInspectionPacket, player: Player) {
        this._gameSystem.setPlayerEntityInspection(player, packet.entityID);
    }
    public removeComponentDelegate(packet: ClientRemoveComponentPacket, player: Player) {
        this._gameSystem.removeComponent(packet.componentID);
    }
    public executeScriptDelegate(
            packet: ClientExecuteScriptPacket, player: Player) {
        this._gameSystem.runResourcePlayerScript(packet.script, packet.args, player, packet.entityID);
    }
}
