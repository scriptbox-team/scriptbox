import ClientEntityInspectionPacket from "networking/packets/client-entity-inspection-packet";

const serializedPacket = {entityID: "E1234567890123456789012"};
const packet = new ClientEntityInspectionPacket("E1234567890123456789012");

describe("ClientObjectDeletionPacket", () => {
    test("serializes", () => {
        const serializedTest = packet.serialize();
        expect(serializedTest).toEqual(serializedPacket);
    });

    test("deserializes", () => {
        const packetTest = ClientEntityInspectionPacket.deserialize(serializedPacket);
        expect(packetTest).toEqual(packet);
    });
});
