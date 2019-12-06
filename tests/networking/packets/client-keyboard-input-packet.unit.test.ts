import ClientKeyboardInputPacket from "networking/packets/client-keyboard-input-packet";

const serializedPacket = {key: 38, state: 0, device: 0};
const packet = new ClientKeyboardInputPacket(38, 0, 0);

describe("ClientObjectDeletionPacket", () => {
    test("serializes", () => {
        const serializedTest = packet.serialize();
        expect(serializedTest).toEqual(serializedPacket);
    });

    test("deserializes", () => {
        const packetTest = ClientKeyboardInputPacket.deserialize(serializedPacket);
        expect(packetTest).toEqual(packet);
    });
});
