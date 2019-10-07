import NetEventHandler from "networking/net-event-handler";
import Networker from "networking/networker";
import ClientConnectionPacket from "networking/packets/client-connection-packet";
import ClientDisconnectPacket from "networking/packets/client-disconnect-packet";

import Player from "./player";
import PlayerManager from "./player-manager";

export default class PlayerManagerNetworker extends Networker {
    private _playerManager: PlayerManager;
    private _nPlayer = 0; // Temporary, should definitely absolutely not be here if it were permanent
    constructor(playerManager: PlayerManager) {
        super();
        this.playerCreate = this.playerCreate.bind(this);
        this.playerDelete = this.playerDelete.bind(this);
        this._playerManager = playerManager;
    }
    public hookupInput(netEventHandler: NetEventHandler) {
        netEventHandler.playerCreate = this.playerCreate;
        netEventHandler.playerRemove = this.playerDelete;
    }
    public playerCreate(packet: ClientConnectionPacket) {
        const playerNum = this._nPlayer++;
        const name = "EpicGamer" + playerNum;
        const displayName = "Epic Gamer " + playerNum;
        const player = this._playerManager.createPlayer({
            controllingEntity: null,
            username: name,
            displayName
        });
        return player;
    }
    public playerDelete(
            packet: ClientDisconnectPacket,
            player: Player | undefined) {
        this._playerManager.removePlayer(player!);
    }
}
