import ClientEditComponentPacket from "networking/packets/client-edit-component-packet";

const serializedPacket = {componentID: "testComponent", property: "testProperty", value: "test", type: "string"};
const packet = new ClientEditComponentPacket("testComponent", "testProperty", "test", "string");

describe("ClientEditComponentPacket", () => {
    test("serializes", () => {
        const serializedTest = packet.serialize();
        expect(serializedTest).toEqual(serializedPacket);
    });

    test("deserializes", () => {
        const packetTest = ClientEditComponentPacket.deserialize(serializedPacket);
        expect(packetTest).toEqual(packet);
    });
});
