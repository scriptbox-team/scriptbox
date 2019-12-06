import ServerSoundPacket from "networking/packets/server-sound-packet";
import AudioObject from "resource-management/audio-object";

const audioPackage = [
    new AudioObject("sound1", "R1234567890123456789012", 1, false),
    new AudioObject("sound2", "R2234567890123456789012", 0.5, true),
    new AudioObject("sound3", "R3234567890123456789012", 0.2, false)
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
