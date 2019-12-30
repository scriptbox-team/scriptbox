import ServerConnectionAcknowledgementPacket from "networking/packets/server-connection-acknowledgement-packet";

const serializedPacket = {resourceServerIP: "192.168.0.1:7778"};
const packet = new ServerConnectionAcknowledgementPacket("192.168.0.1:7778");

describe("ServerConnectionAcknowledgementPacket", () => {
    test("serializes", () => {
        const serializedTest = packet.serialize();
        expect(serializedTest).toEqual(serializedPacket);
    });

    test("deserializes", () => {
        const packetTest = ServerConnectionAcknowledgementPacket.deserialize(serializedPacket);
        expect(packetTest).toEqual(packet);
    });
});
