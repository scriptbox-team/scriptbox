import NetEventHandler from "networking/net-event-handler";
import Networker from "networking/networker";
import request from "request";

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
    private _loginServerURL: string;
    constructor(netHost: NetHost, loginServerURL: string) {
        this._netHost = netHost;
        this._loginServerURL = loginServerURL;
        this._validateLoginToken = this._validateLoginToken.bind(this);
        this._netHost.validateToken = this._validateLoginToken;
        this._netEventHandler = new NetEventHandler();

        this._netHost.on("connection", async (connectionID: number, event: ClientNetEvent) => {
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
    private _validateLoginToken(token: string) {
        return new Promise<string>((resolve, reject) => {
            request.post({url: this._loginServerURL, formData: {token}, json: true}, (err, response, body) => {
                if (err) {
                    reject(err);
                }
                resolve(body.username);
            });
        });
    }
}
