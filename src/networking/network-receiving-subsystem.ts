import NetEventHandler from "networking/net-event-handler";
import Networker from "networking/networker";

import ClientNetEvent, { ClientEventType } from "./client-net-event";
import NetHost from "./net-host";

/**
 * A subsystem for the Network system concerned with receiving packets from clients.
 *
 * @export
 * @class NetworkReceivingSubsystem
 */
export default class NetworkReceivingSubsystem {
    private _netEventHandler: NetEventHandler;
    private _netHost: NetHost;
    constructor(netHost: NetHost) {
        this._netHost = netHost;
        this._netEventHandler = new NetEventHandler();

        this._netHost.on("connection", (connectionID: number, event: ClientNetEvent) => {
            this._netEventHandler.handle(connectionID, event);
        });
        this._netHost.on("disconnect", (connectionID: number, event: ClientNetEvent) => {
            this._netEventHandler.handle(connectionID, event);
        });
        this._netHost.on("event", (connectionID: number, event: ClientNetEvent) => {
            this._netEventHandler.handle(connectionID, event);
        });
    }
    public hookupNetworkers(networkers: Networker[]) {
        networkers.forEach((networker) => networker.hookupInput(this._netEventHandler));
    }
}
