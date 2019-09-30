import ClientDisconnectionRequestPacket from "networking/packets/client-disconnection-request-packet";

const serializedPacket = {};
const packet = new ClientDisconnectionRequestPacket();

describe("ClientDisconnectionRequestPacket", () => {
    test("serializes", () => {
        const serializedTest = packet.serialize();
        expect(serializedTest).toEqual(serializedPacket);
    });

    test("deserializes", () => {
        const packetTest = ClientDisconnectionRequestPacket
    .deserialize(serializedPacket);
        expect(packetTest).toEqual(packet);
    });
});
