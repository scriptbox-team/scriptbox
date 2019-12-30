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

    test("upper bound state deserialization", () => {
        const serializedTestPacket = Object.assign({}, serializedPacket);
        serializedTestPacket.tokenType = 3;
        const expectedResult = new ClientTokenRequestPacket(3);
        const packetTest = ClientTokenRequestPacket.deserialize(serializedTestPacket);
        expect(packetTest).toEqual(expectedResult);
    });
    test("upper out-of-bound state deserialization", () => {
        expect(() => {
            const serializedTestPacket = Object.assign({}, serializedPacket);
            serializedTestPacket.tokenType = 4;
            const packetTest = ClientTokenRequestPacket.deserialize(serializedTestPacket);
        }).toThrow();
    });
    test("lower out-of-bound state deserialization", () => {
        expect(() => {
            const serializedTestPacket = Object.assign({}, serializedPacket);
            serializedTestPacket.tokenType = 0;
            const packetTest = ClientTokenRequestPacket.deserialize(serializedTestPacket);
        }).toThrow();
    });
});
