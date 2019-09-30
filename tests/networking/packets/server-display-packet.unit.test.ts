import ServerDisplayPacket from "networking/packets/server-display-packet";
import RenderObject from "resource-management/render-object";

const displayPackage = [
    new RenderObject(
        123,
        456,
        "testTex",
        {
            x: 4,
            y: 10,
            width: 32,
            height: 32
        },
        {
            x: 10,
            y: 10
        },
        -1,
        false
    ),
    new RenderObject(
        124,
        222,
        "testTex2",
        {
            x: 20,
            y: 50,
            width: 2,
            height: 2
        },
        {
            x: 102,
            y: 1
        },
        1,
        true
    )
];

const serializedPacket = {displayPackage};
const packet = new ServerDisplayPacket(displayPackage);

describe("ServerDisplayPacket", () => {
    test("serializes", () => {
        const serializedTest = packet.serialize();
        expect(serializedTest).toEqual(serializedPacket);
    });

    test("deserializes", () => {
        const packetTest = ServerDisplayPacket.deserialize(serializedPacket);
        expect(packetTest).toEqual(packet);
    });
});
