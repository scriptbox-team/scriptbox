import Player from "core/player";

import NetEventHandler from "./net-event-handler";
import Networker from "./networker";
import ClientConnectionPacket from "./packets/client-connection-packet";
import ClientDisconnectPacket from "./packets/client-disconnect-packet";
import PlayerNetworkManager from "./player-network-manager";

export default class PlayerNetworkManagerNetworker extends Networker {
    private _playerNetworkManager: PlayerNetworkManager;
    constructor(playerNetworkManager: PlayerNetworkManager) {
        super();
        this.connectionDelegate = this.connectionDelegate.bind(this);
        this.disconnectionDelegate = this.disconnectionDelegate.bind(this);
        this._playerNetworkManager = playerNetworkManager;
    }
    public hookupInput(netEventHandler: NetEventHandler) {
        netEventHandler.addConnectionDelegate(this.connectionDelegate);
        netEventHandler.addDisconnectionDelegate(this.disconnectionDelegate);
    }
    public connectionDelegate(packet: ClientConnectionPacket, player: Player) {
        this._playerNetworkManager.setClientPlayer({id: packet.clientID, ip: packet.ip}, player);
    }
    public disconnectionDelegate(packet: ClientDisconnectPacket, player: Player) {
        this._playerNetworkManager.removePlayer(player);
    }
}
