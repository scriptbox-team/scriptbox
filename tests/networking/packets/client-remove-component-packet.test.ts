import ClientRemoveComponentPacket from "networking/packets/client-remove-component-packet";

const serializedPacket = {componentID: "testComponent"};
const packet = new ClientRemoveComponentPacket("testComponent");

describe("ClientRemoveComponentPacket", () => {
    test("serializes", () => {
        const serializedTest = packet.serialize();
        expect(serializedTest).toEqual(serializedPacket);
    });

    test("deserializes", () => {
        const packetTest = ClientRemoveComponentPacket.deserialize(serializedPacket);
        expect(packetTest).toEqual(packet);
    });
});
