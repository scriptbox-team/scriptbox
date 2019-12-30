/**
 * Represents a client that is connected to the server.
 * This keeps track of the client's username, ID, and also the connection ID used by the
 * NetHost.
 *
 * @export
 * @class Client
 * @module core
 */
export default class Client {
    /**
     * The ID of the client.
     *
     * @readonly
     * @memberof Client
     */
    public get id() {
        return this._id;
    }
    /**
     * The username of the client.
     *
     * @readonly
     * @memberof Client
     */
    public get username() {
        return this._username;
    }
    /**
     * The connection ID for the client.
     *
     * @readonly
     * @memberof Client
     */
    public get netClientID() {
        return this._netClientID;
    }
    /**
     * The display name of the client.
     *
     * @type {string}
     * @memberof Client
     */
    public displayName: string;
    private _id: string;
    private _username: string;
    private _netClientID: number;

    constructor(id: string, clientID: number, username: string, displayName: string) {
        this._id = id;
        this._netClientID = clientID;
        this._username = username;
        this.displayName = displayName;
    }
}
