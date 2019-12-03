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
    private _doValidateLoginToken: boolean;
    constructor(netHost: NetHost, loginServerURL: string, useLoginServer: boolean = true) {
        this._netHost = netHost;
        this._loginServerURL = loginServerURL;
        this._validateLogin = this._validateLogin.bind(this);
        this._netHost.validateToken = this._validateLogin;
        this._doValidateLoginToken = useLoginServer;
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
    private _validateLogin(username: string, token: string) {
        if (this._doValidateLoginToken) {
            return new Promise<string>((resolve, reject) => {
                request.post({url: this._loginServerURL, formData: {token}, json: true}, (err, response, body) => {
                    if (err) {
                        reject(err);
                    }
                    if (username !== body.username) {
                        reject("Username and token username do not match");
                    }
                    resolve(body.username);
                });
            });
        }
        else {
            return Promise.resolve(username);
        }
    }
}
