import IDGenerator from "core/id-generator";

describe("IDGenerator", () => {
    test("can convert mongo ID to game ID", () => {
        const id = IDGenerator.makeFromHexString("0123456789ABCDEF00112233");
        expect(id).toEqual("89ABCDEF0011223301234567");
    });
    test("can convert game ID to mongo ID", () => {
        const id = IDGenerator.makeHexStringFromID("89ABCDEF0011223301234567");
        expect(id).toEqual("0123456789ABCDEF00112233");
    });
    test("can generate many unique IDs at once", () => {
        const ids: {[id: string]: boolean} = {};
        for (let i = 0; i < 100000; i++) {
            const id = IDGenerator.generate();
            if (ids[id]) {
                throw new Error("Generated ID was not unique");
            }
            ids[id] = true;
        }
    });
});
