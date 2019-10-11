import ClientEntityCreationPacket from "networking/packets/client-entity-creation-packet";

const serializedPacket = {prefabID: "123", x: 23, y: 45};
const packet = new ClientEntityCreationPacket("123", 23, 45);

describe("ClientEntityCreationPacket", () => {
    test("serializes", () => {
        const serializedTest = packet.serialize();
        expect(serializedTest).toEqual(serializedPacket);
    });

    test("deserializes", () => {
        const packetTest = ClientEntityCreationPacket.deserialize(serializedPacket);
        expect(packetTest).toEqual(packet);
    });
});
