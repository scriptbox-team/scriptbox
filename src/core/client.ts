export default class Client {
    public get id() {
        return this._id;
    }
    public get username() {
        return this._username;
    }
    public get netClientID() {
        return this._netClientID;
    }
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
