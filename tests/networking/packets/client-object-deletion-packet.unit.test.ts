import ClientObjectDeletionPacket from "networking/packets/client-object-deletion-packet";

const serializedPacket = {id: "123"};
const packet = new ClientObjectDeletionPacket("123");

describe("ClientObjectDeletionPacket", () => {
    test("serializes", () => {
        const serializedTest = packet.serialize();
        expect(serializedTest).toEqual(serializedPacket);
    });

    test("deserializes", () => {
        const packetTest = ClientObjectDeletionPacket.deserialize(serializedPacket);
        expect(packetTest).toEqual(packet);
    });
});
