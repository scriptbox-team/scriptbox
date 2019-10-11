import ServerConnectionPacket from "networking/packets/server-connection-packet";

const serializedPacket = {};
const packet = new ServerConnectionPacket();

describe("ServerConnectionPacket", () => {
    test("serializes", () => {
        const serializedTest = packet.serialize();
        expect(serializedTest).toEqual(serializedPacket);
    });

    test("deserializes", () => {
        const packetTest = ServerConnectionPacket.deserialize(serializedPacket);
        expect(packetTest).toEqual(packet);
    });
});
