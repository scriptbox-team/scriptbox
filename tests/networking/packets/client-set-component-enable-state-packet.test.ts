import ClientSetComponentEnableStatePacket from "networking/packets/client-set-component-enable-state-packet";

const serializedPacket = {componentID: "123", enableState: true};
const packet = new ClientSetComponentEnableStatePacket("123", true);

describe("ClientSetControlPacket", () => {
    test("serializes", () => {
        const serializedTest = packet.serialize();
        expect(serializedTest).toEqual(serializedPacket);
    });

    test("deserializes", () => {
        const packetTest = ClientSetComponentEnableStatePacket.deserialize(serializedPacket);
        expect(packetTest).toEqual(packet);
    });
});
