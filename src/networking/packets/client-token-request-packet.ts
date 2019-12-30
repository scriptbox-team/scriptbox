import Packet from "./packet";

export enum TokenType {
    FileUpload = 1,
    FileReupload = 2,
    FileDelete = 3
}

/**
 * A packet containing a request for a token for use with another network operation.
 *
 * @export
 * @class ClientTokenRequestPacket
 * @extends {Packet}
 * @module networking
 */
export default class ClientTokenRequestPacket extends Packet {
    public static deserialize(obj: any): ClientTokenRequestPacket | undefined {
        if (typeof obj === "object" && obj !== null) {
            if (
                typeof obj.tokenType === "number"
            ) {
                if (!("" + obj.tokenType in TokenType)) {
                    throw new Error("Invalid enum value " + obj.tokenType);
                }
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
