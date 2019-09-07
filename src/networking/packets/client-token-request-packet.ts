import Packet from "./packet";

export enum TokenType {
    FileUpload = 1,
    FileReupload = 2,
    FileDelete = 3
}

export default class ClientTokenRequestPacket extends Packet {
    public static deserialize(obj: any): ClientTokenRequestPacket | undefined {
        if (typeof obj === "object" && obj !== null) {
            if (
                typeof obj.tokenType === "number"
            ) {
                return new ClientTokenRequestPacket(obj.tokenType);
            }
            return undefined;
        }
    }

    public tokenType: TokenType;
    constructor(tokenType: TokenType) {
        super();
        this.tokenType = tokenType;
    }
    public serialize() {
        return this;
    }
}
