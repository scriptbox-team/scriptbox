import IDGenerator from "core/id-generator";

describe("id-generator", () => {
    test("can convert mongo ID to game ID", () => {
        const id = IDGenerator.makeFromHexString("0123456789ABCDEF00112233");
        expect(id).toEqual("89ABCDEF0011223301234567");
    });
    test("can convert game ID to mongo ID", () => {
        const id = IDGenerator.makeHexStringFromID("89ABCDEF0011223301234567");
        expect(id).toEqual("0123456789ABCDEF00112233");
    });
});
