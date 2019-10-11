import ClientRemoveComponentPacket from "networking/packets/client-remove-component-packet";

const serializedPacket = {componentID: "123"};
const packet = new ClientRemoveComponentPacket("123");

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
