import ClientEditScriptPacket from "networking/packets/client-edit-script-packet";

const serializedPacket = {scriptID: "R1234567890123456789012", script: "while (true){}"};
const packet = new ClientEditScriptPacket("R1234567890123456789012", "while (true){}");

describe("ClientEditScriptPacket", () => {
    test("serializes", () => {
        const serializedTest = packet.serialize();
        expect(serializedTest).toEqual(serializedPacket);
    });

    test("deserializes", () => {
        const packetTest = ClientEditScriptPacket.deserialize(serializedPacket);
        expect(packetTest).toEqual(packet);
    });
});
