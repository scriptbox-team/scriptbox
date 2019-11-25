import NetEventHandler from "networking/net-event-handler";
import Networker from "networking/networker";
import ClientConnectionPacket from "networking/packets/client-connection-packet";
import ClientDisconnectPacket from "networking/packets/client-disconnect-packet";

import Client from "./client";
import IDGenerator from "./id-generator";
import Manager from "./manager";

export default class ClientManagerNetworker extends Networker {
    private _playerManager: Manager<Client>;
    private _idGenerator: IDGenerator;
    constructor(playerManager: Manager<Client>, idGenerator: IDGenerator) {
        super();
        this.playerCreate = this.playerCreate.bind(this);
        this.playerDelete = this.playerDelete.bind(this);
        this._playerManager = playerManager;
        this._idGenerator = idGenerator;
    }
    public hookupInput(netEventHandler: NetEventHandler) {
        netEventHandler.playerCreate = this.playerCreate;
        netEventHandler.playerRemove = this.playerDelete;
    }
    public playerCreate(connectionID: number, packet: ClientConnectionPacket) {
        const playerNum = connectionID;
        const playerID = this._idGenerator.makeFrom("P", Date.now(), Math.random());
        const username = packet.username;
        const displayName = packet.username;
        const player = this._playerManager.create(playerID, connectionID, username, displayName);
        return player;
    }
    public playerDelete(
            packet: ClientDisconnectPacket,
            player: Client) {
        this._playerManager.queueForDeletion(player.id);
    }
}
