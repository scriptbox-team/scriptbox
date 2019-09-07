import Packet from "./packet";

export enum TokenType {
    FileUpload = 1,
    FileReupload = 2,
    FileDelete = 3
}

export default class ServerTokenPacket extends Packet {
    public static deserialize(obj: any): ServerTokenPacket | undefined {
        if (typeof obj === "object" && obj !== null) {
            if (
                typeof obj.tokenType === "number"
                && typeof obj.token === "number"
            ) {
                return new ServerTokenPacket(obj.tokenType, obj.token);
            }
            return undefined;
        }
    }

    public tokenType: TokenType;
    public token: number;
    constructor(tokenType: TokenType, token: number) {
        super();
        this.tokenType = tokenType;
        this.token = token;
    }
    public serialize() {
        return this;
    }
}
