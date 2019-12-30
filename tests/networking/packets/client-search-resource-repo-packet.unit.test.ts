import ClientSearchResourceRepoPacket from "networking/packets/client-search-resource-repo-packet";

const serializedPacket = {search: "search terms here"};
const packet = new ClientSearchResourceRepoPacket("search terms here");

describe("ClientEditScriptPacket", () => {
    test("serializes", () => {
        const serializedTest = packet.serialize();
        expect(serializedTest).toEqual(serializedPacket);
    });

    test("deserializes", () => {
        const packetTest = ClientSearchResourceRepoPacket.deserialize(serializedPacket);
        expect(packetTest).toEqual(packet);
    });
});
