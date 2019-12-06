import ServerResourceRepoListingPacket from "networking/packets/server-resource-repo-list-packet";
import Resource, { ResourceType } from "resource-management/resource";

const resources = [
    new Resource(
        "123",
        ResourceType.Image,
        "test resource",
        "testresource.png",
        "aaron",
        "not aaron",
        "a test resource",
        10525892184,
        "iconID",
        false
    ),
    new Resource(
        "456",
        ResourceType.Sound,
        "test resource 2",
        "testresource2.png",
        "aaron",
        "aaron",
        "a test sound",
        10525235184,
        "iconID2",
        true
    ),
    new Resource(
        "789",
        ResourceType.Script,
        "game breaking resource script",
        "gamebreakingscript.ts",
        "not aaron",
        "somebody evil",
        "blows up the world",
        10525892184,
        "iconID",
        false
    ),
];

const serializedPacket = {search: "resource", resources};
const packet = new ServerResourceRepoListingPacket("resource", resources);

describe("ServerResourceListingPacket", () => {
    test("serializes", () => {
        const serializedTest = packet.serialize();
        expect(serializedTest).toEqual(serializedPacket);
    });

    test("deserializes", () => {
        const packetTest = ServerResourceRepoListingPacket.deserialize(serializedPacket);
        expect(packetTest).toEqual(packet);
    });
});
