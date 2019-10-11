export default class Player {
    public get id() {
        return this._id;
    }
    public get username() {
        return this._username;
    }
    public get clientID() {
        return this._clientID;
    }
    public displayName: string;
    public controllingEntity: number | null;
    public controlSet: {[input: string]: string};
    private _id: string;
    private _username: string;
    private _clientID: number;

    constructor(id: string, clientID: number, username: string, displayName: string) {
        this._id = id;
        this._clientID = clientID;
        this._username = username;
        this.displayName = displayName;
        this.controllingEntity = null;
        this.controlSet = {
            38: "up",
            40: "down",
            37: "left",
            39: "right"
        };
    }
    public convertInput(input: number): string {
        return this.controlSet["" + input];
    }
}
