import ClientEntityDeletionPacket from "networking/packets/client-entity-deletion-packet";

const serializedPacket = {id: "123"};
const packet = new ClientEntityDeletionPacket("123");

describe("ClientObjectDeletionPacket", () => {
    test("serializes", () => {
        const serializedTest = packet.serialize();
        expect(serializedTest).toEqual(serializedPacket);
    });

    test("deserializes", () => {
        const packetTest = ClientEntityDeletionPacket.deserialize(serializedPacket);
        expect(packetTest).toEqual(packet);
    });
});
