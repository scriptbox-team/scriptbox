import ServerTokenPacket, { TokenType } from "networking/packets/server-token-packet";

const serializedPacket = {tokenType: TokenType.FileUpload, token: 18192548129582890};
const packet = new ServerTokenPacket(TokenType.FileUpload, 18192548129582890);

describe("ServerTokenPacket", () => {
    test("serializes", () => {
        const serializedTest = packet.serialize();
        expect(serializedTest).toEqual(serializedPacket);
    });

    test("deserializes", () => {
        const packetTest = ServerTokenPacket.deserialize(serializedPacket);
        expect(packetTest).toEqual(packet);
    });
});
