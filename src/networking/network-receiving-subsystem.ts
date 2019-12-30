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
 * @module networking
 */
export default class NetworkReceivingSubsystem {
    private _netEventHandler: NetEventHandler;
    private _netHost: NetHost;
    private _loginServerURL?: string;
    /**
     * Creates an instance of NetworkReceivingSubsystem.
     * @param {NetHost} netHost The NetHost to use
     * @param {string} [loginServerURL] The login server URL to use
     * @memberof NetworkReceivingSubsystem
     */
    constructor(netHost: NetHost, loginServerURL?: string) {
        this._netHost = netHost;
        this._loginServerURL = loginServerURL;
        this._validateLogin = this._validateLogin.bind(this);
        this._netHost.validateToken = this._validateLogin;
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
    /**
     * Set the URL to validate login tokens with.
     *
     * @param {string} [url] The URL to validate with.
     * @memberof NetworkReceivingSubsystem
     */
    public setValidationURL(url?: string) {
        this._loginServerURL = url;
    }
    /**
     * Hook up a list of networkers with the NetEventHandler
     *
     * @param {Networker[]} networkers An array of networkers to hook up
     * @memberof NetworkReceivingSubsystem
     */
    public hookupNetworkers(networkers: Networker[]) {
        networkers.forEach((networker) => networker.hookupInput(this._netEventHandler));
    }
    /**
     * Validate a login.
     *
     * @private
     * @param {string} username The username of the client.
     * @param {string} token The token of the client.
     * @returns A promise that resolves to the username to use for the client.
     * @memberof NetworkReceivingSubsystem
     */
    private _validateLogin(username: string, token: string) {
        if (this._loginServerURL !== undefined) {
            return new Promise<string>((resolve, reject) => {
                request.post({url: this._loginServerURL!, formData: {token}, json: true}, (err, response, body) => {
                    if (err || response.statusCode !== 200) {
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
