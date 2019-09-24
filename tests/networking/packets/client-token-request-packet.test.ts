import ClientTokenRequestPacket, { TokenType } from "networking/packets/client-token-request-packet";

const serializedPacket = {tokenType: TokenType.FileUpload};
const packet = new ClientTokenRequestPacket(TokenType.FileUpload);

describe("ClientTokenRequestPacket", () => {
    test("serializes", () => {
        const serializedTest = packet.serialize();
        expect(serializedTest).toEqual(serializedPacket);
    });

    test("deserializes", () => {
        const packetTest = ClientTokenRequestPacket.deserialize(serializedPacket);
        expect(packetTest).toEqual(packet);
    });
});
