import ClientConnectionInfoPacket from "networking/packets/client-connection-info-packet";

const serializedPacket = {token: "12345678", username: "testUser"};
const packet = new ClientConnectionInfoPacket("12345678", "testUser");

describe("ClientConnectionInfoPacket", () => {
    test("serializes", () => {
        const serializedTest = packet.serialize();
        expect(serializedTest).toEqual(serializedPacket);
    });

    test("deserializes", () => {
        const packetTest = ClientConnectionInfoPacket.deserialize(serializedPacket);
        expect(packetTest).toEqual(packet);
    });
});
