import ClientPrefabCreationPacket from "networking/packets/client-prefab-creation-packet";

const serializedPacket = {id: "E1234567890123456789012"};
const packet = new ClientPrefabCreationPacket("E1234567890123456789012");

describe("ClientAddComponentPacket", () => {
    test("serializes", () => {
        const serializedTest = packet.serialize();
        expect(serializedTest).toEqual(serializedPacket);
    });

    test("deserializes", () => {
        const packetTest = ClientPrefabCreationPacket.deserialize(serializedPacket);
        expect(packetTest).toEqual(packet);
    });
});
