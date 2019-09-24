import ClientConnectionInfoPacket from "networking/packets/client-connection-info-packet";

const serializedPacket = {};
const packet = new ClientConnectionInfoPacket();

describe("ClientConnectionInfoPacket", () => {
    test("serializes", () => {
        const serializedTest = packet.serialize();
        expect(serializedTest).toEqual(serializedPacket);
    });

    test("deserializes", () => {
        const packetTest = ClientConnectionInfoPacket.deserialize(serializedPacket);
        expect(packetTest).toEqual(packet);
    });
});
