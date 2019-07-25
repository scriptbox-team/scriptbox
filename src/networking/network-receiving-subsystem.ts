import NetEventHandler from "networking/net-event-handler";
import ClientNetEvent, { ClientEventType } from "./client-net-event";
import NetHost from "./net-host";
import PlayerNetworkManager from "./player-network-manager";

/**
 * A subsystem for the Network system concerned with receiving packets from clients.
 *
 * @export
 * @class NetworkReceivingSubsystem
 */
export default class NetworkReceivingSubsystem {
    public netEventHandler: NetEventHandler;
    private _netHost: NetHost;
    private _playerNetworkManager: PlayerNetworkManager;
    constructor(netHost: NetHost, playerNetworkManager: PlayerNetworkManager) {
        this._netHost = netHost;
        this._playerNetworkManager = playerNetworkManager;
        this.netEventHandler = new NetEventHandler(this._playerNetworkManager);

        this._netHost.on("connection", (connectionID: number, event: ClientNetEvent) => {
            this.netEventHandler.handle(connectionID, event);
        });
        this._netHost.on("disconnect", (connectionID: number, event: ClientNetEvent) => {
            this.netEventHandler.handle(connectionID, event);
        });
        this._netHost.on("event", (connectionID: number, event: ClientNetEvent) => {
            this.netEventHandler.handle(connectionID, event);
        });
    }
}
