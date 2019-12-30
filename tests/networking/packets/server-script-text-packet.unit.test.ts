import ServerScriptTextPacket from "networking/packets/server-script-text-packet";

const serializedPacket = {scriptID: "R1234567890123456789012", script: ""};
const packet = new ServerScriptTextPacket("R1234567890123456789012", "");

describe("ServerResourceListingPacket", () => {
    test("serializes", () => {
        const serializedTest = packet.serialize();
        expect(serializedTest).toEqual(serializedPacket);
    });

    test("deserializes", () => {
        const packetTest = ServerScriptTextPacket.deserialize(serializedPacket);
        expect(packetTest).toEqual(packet);
    });
});
