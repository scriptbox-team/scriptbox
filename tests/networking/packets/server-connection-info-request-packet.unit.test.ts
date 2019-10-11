import ServerConnectionInfoRequestPacket from "networking/packets/server-connection-info-request-packet";

const serializedPacket = {};
const packet = new ServerConnectionInfoRequestPacket();

describe("ServerConnectionInfoRequestPacket", () => {
    test("serializes", () => {
        const serializedTest = packet.serialize();
        expect(serializedTest).toEqual(serializedPacket);
    });

    test("deserializes", () => {
        const packetTest = ServerConnectionInfoRequestPacket.deserialize(serializedPacket);
        expect(packetTest).toEqual(packet);
    });
});
