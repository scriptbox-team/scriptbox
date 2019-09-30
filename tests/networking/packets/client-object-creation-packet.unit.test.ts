import ClientObjectCreationPacket from "networking/packets/client-object-creation-packet";

const serializedPacket = {prefabID: "123", x: 23, y: 45};
const packet = new ClientObjectCreationPacket("123", 23, 45);

describe("ClientObjectCreationPacket", () => {
    test("serializes", () => {
        const serializedTest = packet.serialize();
        expect(serializedTest).toEqual(serializedPacket);
    });

    test("deserializes", () => {
        const packetTest = ClientObjectCreationPacket.deserialize(serializedPacket);
        expect(packetTest).toEqual(packet);
    });
});
