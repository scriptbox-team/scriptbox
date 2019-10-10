import Player from "core/player";
import NetEventHandler from "networking/net-event-handler";
import Networker from "networking/networker";
import ClientConnectionPacket from "networking/packets/client-connection-packet";
import ClientDisconnectPacket from "networking/packets/client-disconnect-packet";
import ClientExecuteScriptPacket from "networking/packets/client-execute-script-packet";
import ClientKeyboardInputPacket from "networking/packets/client-keyboard-input-packet";
import ClientObjectCreationPacket from "networking/packets/client-object-creation-packet";
import ClientObjectDeletionPacket from "networking/packets/client-object-deletion-packet";
import ClientRemoveComponentPacket from "networking/packets/client-remove-component-packet";
import ClientWatchEntityPacket from "networking/packets/client-watch-entity-packet";

import GameSystem from "./game-system";

export default class GameSystemNetworker extends Networker {
    private _gameSystem: GameSystem;
    constructor(gameSystem: GameSystem) {
        super();
        this.playerConnectionDelegate = this.playerConnectionDelegate.bind(this);
        this.playerDisconnectDelegate = this.playerDisconnectDelegate.bind(this);
        this.playerInputDelegate = this.playerInputDelegate.bind(this);
        this.objectCreationDelegate = this.objectCreationDelegate.bind(this);
        this.objectDeletionDelegate = this.objectDeletionDelegate.bind(this);
        this.watchEntityDelegate = this.watchEntityDelegate.bind(this);
        this.removeComponentDelegate = this.removeComponentDelegate.bind(this);
        this.executeScriptDelegate = this.executeScriptDelegate.bind(this);
        this._gameSystem = gameSystem;
    }
    public hookupInput(netEventHandler: NetEventHandler) {
        netEventHandler.addConnectionDelegate(this.playerConnectionDelegate);
        netEventHandler.addDisconnectionDelegate(this.playerDisconnectDelegate);
        netEventHandler.addObjectCreationDelegate(this.objectCreationDelegate);
        netEventHandler.addObjectDeletionDelegate(this.objectDeletionDelegate);
        netEventHandler.addWatchEntityDelegate(this.watchEntityDelegate);
        netEventHandler.addRemoveComponentDelegate(this.removeComponentDelegate);
        netEventHandler.addInputDelegate(this.playerInputDelegate);
        netEventHandler.addExecuteScriptDelegate(this.executeScriptDelegate);
    }
    public playerConnectionDelegate(packet: ClientConnectionPacket, player: Player) {
        this._gameSystem.createPlayer(player);
    }
    public playerDisconnectDelegate(packet: ClientDisconnectPacket, player: Player) {
        this._gameSystem.setPlayerEntityWatch(player, undefined);
    }
    public playerInputDelegate(packet: ClientKeyboardInputPacket, player: Player) {
        this._gameSystem.handleKeyInput(packet.key, packet.state, player);
    }
    public objectCreationDelegate(packet: ClientObjectCreationPacket, player: Player) {
        this._gameSystem.createEntityAt(packet.prefabID, packet.x, packet.y, player);
    }
    public objectDeletionDelegate(packet: ClientObjectDeletionPacket, player: Player) {
        this._gameSystem.deleteEntity(packet.id);
    }
    public watchEntityDelegate(packet: ClientWatchEntityPacket, player: Player) {
        this._gameSystem.setPlayerEntityWatch(player, packet.entityID);
    }
    public removeComponentDelegate(packet: ClientRemoveComponentPacket, player: Player) {
        this._gameSystem.removeComponent(packet.componentID);
    }
    public executeScriptDelegate(
            packet: ClientExecuteScriptPacket, player: Player) {
        this._gameSystem.runResourcePlayerScript(packet.script, packet.args, player, packet.entityID);
    }
}
