import ClientChatMessagePacket from "networking/packets/client-chat-message-packet";

const serializedPacket = {message: "testMessage"};
const packet = new ClientChatMessagePacket("testMessage");

describe("ClientChatMessagePacket", () => {
    test("serializes", () => {
        const serializedTest = packet.serialize();
        expect(serializedTest).toEqual(serializedPacket);
    });

    test("deserializes", () => {
        const packetTest = ClientChatMessagePacket.deserialize(serializedPacket);
        expect(packetTest).toEqual(packet);
    });
});
