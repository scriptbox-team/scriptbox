import ServerSoundPacket from "networking/packets/server-sound-packet";
import AudioObject from "resource-management/audio-object";

const audioPackage = [
    new AudioObject("sound1", 1, true, false),
    new AudioObject("sound2", 2, true, true),
    new AudioObject("sound3", 4, false, false)
];

const serializedPacket = {audioPackage};
const packet = new ServerSoundPacket(audioPackage);

describe("ServerSoundPacket", () => {
    test("serializes", () => {
        const serializedTest = packet.serialize();
        expect(serializedTest).toEqual(serializedPacket);
    });

    test("deserializes", () => {
        const packetTest = ServerSoundPacket.deserialize(serializedPacket);
        expect(packetTest).toEqual(packet);
    });
});
