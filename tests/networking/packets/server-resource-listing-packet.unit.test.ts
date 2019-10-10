import ServerResourceListingPacket from "networking/packets/server-resource-listing-packet";
import Resource, { ResourceType } from "resource-management/resource";

const resources = [
    new Resource(
        "123",
        ResourceType.Image,
        "test resource",
        "aaron",
        "not aaron",
        "a test resource",
        10525892184,
        "iconID"
    ),
    new Resource(
        "456",
        ResourceType.Sound,
        "test resource 2",
        "aaron",
        "aaron",
        "a test sound",
        10525235184,
        "iconID2"
    ),
    new Resource(
        "789",
        ResourceType.Script,
        "game breaking script",
        "not aaron",
        "somebody evil",
        "blows up the world",
        10525892184,
        "iconID"
    ),
];

const serializedPacket = {resources};
const packet = new ServerResourceListingPacket(resources);

describe("ServerResourceListingPacket", () => {
    test("serializes", () => {
        const serializedTest = packet.serialize();
        expect(serializedTest).toEqual(serializedPacket);
    });

    test("deserializes", () => {
        const packetTest = ServerResourceListingPacket.deserialize(serializedPacket);
        expect(packetTest).toEqual(packet);
    });
});
