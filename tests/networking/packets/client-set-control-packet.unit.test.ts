import ClientSetControlPacket from "networking/packets/client-set-control-packet";

const serializedPacket = {entityID: "123"};
const packet = new ClientSetControlPacket("123");

describe("ClientSetControlPacket", () => {
    test("serializes", () => {
        const serializedTest = packet.serialize();
        expect(serializedTest).toEqual(serializedPacket);
    });

    test("deserializes", () => {
        const packetTest = ClientSetControlPacket.deserialize(serializedPacket);
        expect(packetTest).toEqual(packet);
    });
});
