import ClientKeybindsPacket from "networking/packets/client-keybinds-packet";

const serializedPacket = {keys: {12: "jump", 32: "slide"}, entityID: "123"};
const packet = new ClientKeybindsPacket({12: "jump", 32: "slide"}, "123");

describe("ClientKeybindsPacket", () => {
    test("serializes", () => {
        const serializedTest = packet.serialize();
        expect(serializedTest).toEqual(serializedPacket);
    });

    test("deserializes", () => {
        const packetTest = ClientKeybindsPacket.deserialize(serializedPacket);
        expect(packetTest).toEqual(packet);
    });
});
