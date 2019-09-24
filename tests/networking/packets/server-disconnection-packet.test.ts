import ServerDisconnectionPacket from "networking/packets/server-disconnection-packet";

const serializedPacket = {};
const packet = new ServerDisconnectionPacket();

describe("ServerDisconnectionPacket", () => {
    test("serializes", () => {
        const serializedTest = packet.serialize();
        expect(serializedTest).toEqual(serializedPacket);
    });

    test("deserializes", () => {
        const packetTest = ServerDisconnectionPacket.deserialize(serializedPacket);
        expect(packetTest).toEqual(packet);
    });
});
