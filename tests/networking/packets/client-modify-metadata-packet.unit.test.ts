import ClientModifyMetadataPacket from "networking/packets/client-modify-metadata-packet";

const serializedPacket = {resourceID: "123", property: "testProperty", value: "29"};
const packet = new ClientModifyMetadataPacket("123", "testProperty", "29");

describe("ClientModifyMetadataPacket", () => {
    test("serializes", () => {
        const serializedTest = packet.serialize();
        expect(serializedTest).toEqual(serializedPacket);
    });

    test("deserializes", () => {
        const packetTest = ClientModifyMetadataPacket.deserialize(serializedPacket);
        expect(packetTest).toEqual(packet);
    });
});
