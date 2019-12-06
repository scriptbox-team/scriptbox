import ClientCloneResourcePacket from "networking/packets/client-clone-resource-packet";

const serializedPacket = {resourceID: "R1234567890123456789012"};
const packet = new ClientCloneResourcePacket("R1234567890123456789012");

describe("ClientCloneResourcePacket", () => {
    test("serializes", () => {
        const serializedTest = packet.serialize();
        expect(serializedTest).toEqual(serializedPacket);
    });

    test("deserializes", () => {
        const packetTest = ClientCloneResourcePacket.deserialize(serializedPacket);
        expect(packetTest).toEqual(packet);
    });
});
