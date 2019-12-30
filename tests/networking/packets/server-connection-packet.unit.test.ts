import ServerConnectionPacket from "networking/packets/server-connection-packet";

const serializedPacket = {resourceServerIP: "192.168.0.1:7778"};
const packet = new ServerConnectionPacket("192.168.0.1:7778");

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
