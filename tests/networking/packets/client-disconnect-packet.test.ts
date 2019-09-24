import ClientDisconnectPacket from "networking/packets/client-disconnect-packet";

const serializedPacket = {code: 1001};
const packet = new ClientDisconnectPacket(1001);

describe("ClientDisconnectPacket", () => {
    test("serializes", () => {
        const serializedTest = packet.serialize();
        expect(serializedTest).toEqual(serializedPacket);
    });

    test("deserializes", () => {
        const packetTest = ClientDisconnectPacket.deserialize(serializedPacket);
        expect(packetTest).toEqual(packet);
    });
});
