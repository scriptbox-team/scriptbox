import ClientModifyComponentMetaPacket from "networking/packets/client-modify-component-meta-packet";

const serializedPacket = {componentID: "123", property: "testProperty", value: "29"};
const packet = new ClientModifyComponentMetaPacket("123", "testProperty", "29");

describe("ClientModifyMetadataPacket", () => {
    test("serializes", () => {
        const serializedTest = packet.serialize();
        expect(serializedTest).toEqual(serializedPacket);
    });

    test("deserializes", () => {
        const packetTest = ClientModifyComponentMetaPacket.deserialize(serializedPacket);
        expect(packetTest).toEqual(packet);
    });
});
