import ServerChatMessagePacket from "networking/packets/server-chat-message-packet";

const serializedPacket = {message: "hello"};
const packet = new ServerChatMessagePacket("hello");

describe("ServerChatMessagePacket", () => {
    test("serializes", () => {
        const serializedTest = packet.serialize();
        expect(serializedTest).toEqual(serializedPacket);
    });

    test("deserializes", () => {
        const packetTest = ServerChatMessagePacket.deserialize(serializedPacket);
        expect(packetTest).toEqual(packet);
    });
});
