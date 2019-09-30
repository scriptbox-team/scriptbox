import ClientExecuteScriptPacket from "networking/packets/client-execute-script-packet";

const serializedPacket = {script: "testScriptID", args: "banana 2", entityID: 123};
const packet = new ClientExecuteScriptPacket("testScriptID", "banana 2", 123);

describe("ClientExecuteScriptPacket", () => {
    test("serializes", () => {
        const serializedTest = packet.serialize();
        expect(serializedTest).toEqual(serializedPacket);
    });

    test("deserializes", () => {
        const packetTest = ClientExecuteScriptPacket.deserialize(serializedPacket);
        expect(packetTest).toEqual(packet);
    });
});
