import ClientKeyboardInputPacket from "networking/packets/client-keyboard-input-packet";

const serializedPacket = {key: 38, state: 0, device: 0};
const packet = new ClientKeyboardInputPacket(38, 0, 0);

describe("ClientObjectDeletionPacket", () => {
    test("serializes", () => {
        const serializedTest = packet.serialize();
        expect(serializedTest).toEqual(serializedPacket);
    });

    test("deserializes", () => {
        const packetTest = ClientKeyboardInputPacket.deserialize(serializedPacket);
        expect(packetTest).toEqual(packet);
    });
    test("upper bound state deserialization", () => {
        const serializedTestPacket = Object.assign({}, serializedPacket);
        serializedTestPacket.state = 2;
        const expectedResult = new ClientKeyboardInputPacket(38, 2, 0);
        const packetTest = ClientKeyboardInputPacket.deserialize(serializedTestPacket);
        expect(packetTest).toEqual(expectedResult);
    });
    test("upper out-of-bound state deserialization", () => {
        expect(() => {
            const serializedTestPacket = Object.assign({}, serializedPacket);
            serializedTestPacket.state = 3;
            const packetTest = ClientKeyboardInputPacket.deserialize(serializedTestPacket);
        }).toThrow();
    });
    test("lower out-of-bound state deserialization", () => {
        expect(() => {
            const serializedTestPacket = Object.assign({}, serializedPacket);
            serializedTestPacket.state = -1;
            const packetTest = ClientKeyboardInputPacket.deserialize(serializedTestPacket);
        }).toThrow();
    });
    test("upper bound device deserialization", () => {
        const serializedTestPacket = Object.assign({}, serializedPacket);
        serializedTestPacket.device = 2;
        const expectedResult = new ClientKeyboardInputPacket(38, 0, 2);
        const packetTest = ClientKeyboardInputPacket.deserialize(serializedTestPacket);
        expect(packetTest).toEqual(expectedResult);
    });
    test("upper out-of-bound device deserialization", () => {
        expect(() => {
            const serializedTestPacket = Object.assign({}, serializedPacket);
            serializedTestPacket.device = 3;
            const packetTest = ClientKeyboardInputPacket.deserialize(serializedTestPacket);
        }).toThrow();
    });
    test("lower out-of-bound device deserialization", () => {
        expect(() => {
            const serializedTestPacket = Object.assign({}, serializedPacket);
            serializedTestPacket.device = -1;
            const packetTest = ClientKeyboardInputPacket.deserialize(serializedTestPacket);
        }).toThrow();
    });
});
