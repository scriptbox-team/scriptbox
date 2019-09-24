import ClientAddComponentPacket from "networking/packets/client-add-component-packet";

const serializedPacket = {componentClassID: "testComponent", entityID: "123"};
const packet = new ClientAddComponentPacket("testComponent", "123");

describe("ClientAddComponentPacket", () => {
    test("serializes", () => {
        const serializedTest = packet.serialize();
        expect(serializedTest).toEqual(serializedPacket);
    });

    test("deserializes", () => {
        const packetTest = ClientAddComponentPacket.deserialize(serializedPacket);
        expect(packetTest).toEqual(packet);
    });
});
