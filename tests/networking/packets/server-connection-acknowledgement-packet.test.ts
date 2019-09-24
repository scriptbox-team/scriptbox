import ServerConnectionAcknowledgementPacket from "networking/packets/server-connection-acknowledgement-packet";

const serializedPacket = {};
const packet = new ServerConnectionAcknowledgementPacket();

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
