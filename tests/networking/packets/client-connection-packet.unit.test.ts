import ClientConnectionPacket from "networking/packets/client-connection-packet";

const serializedPacket = {clientID: 123, ip: "192.168.0.1", username: "testUser"};
const packet = new ClientConnectionPacket(123, "192.168.0.1", "testUser");

describe("ClientConnectionPacket", () => {
    test("serializes", () => {
        const serializedTest = packet.serialize();
        expect(serializedTest).toEqual(serializedPacket);
    });

    test("deserializes", () => {
        const packetTest = ClientConnectionPacket.deserialize(serializedPacket);
        expect(packetTest).toEqual(packet);
    });
});
