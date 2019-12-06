import ClientRequestEditScript from "networking/packets/client-request-edit-script-packet";

const serializedPacket = {scriptID: "R1234567890123456789012"};
const packet = new ClientRequestEditScript("R1234567890123456789012");

describe("ClientEditScriptPacket", () => {
    test("serializes", () => {
        const serializedTest = packet.serialize();
        expect(serializedTest).toEqual(serializedPacket);
    });

    test("deserializes", () => {
        const packetTest = ClientRequestEditScript.deserialize(serializedPacket);
        expect(packetTest).toEqual(packet);
    });
});
