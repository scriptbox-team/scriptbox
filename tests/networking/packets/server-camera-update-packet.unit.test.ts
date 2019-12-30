import ServerCameraUpdatePacket from "networking/packets/server-camera-update-packet";

const serializedPacket = {x: 10, y: 20, scale: 1};
const packet = new ServerCameraUpdatePacket(10, 20, 1);

describe("ServerChatMessagePacket", () => {
    test("serializes", () => {
        const serializedTest = packet.serialize();
        expect(serializedTest).toEqual(serializedPacket);
    });

    test("deserializes", () => {
        const packetTest = ServerCameraUpdatePacket.deserialize(serializedPacket);
        expect(packetTest).toEqual(packet);
    });
});
