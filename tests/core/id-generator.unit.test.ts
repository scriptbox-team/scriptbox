import IDGenerator from "core/id-generator";

let idGenerator!: IDGenerator;

beforeEach(() => {
    idGenerator = new IDGenerator(0.5);
});

describe("IDGenerator", () => {
    test("can generate an ID from time and a seed", () => {
        const id = idGenerator.makeFrom(1569883975525, 0.2);
        expect(id).toEqual("33333333338000005d928747");
    });
    test("can convert mongo ID to game ID", () => {
        const id = idGenerator.makeFromHexString("0123456789ABCDEF00112233");
        expect(id).toEqual("89ABCDEF0011223301234567");
    });
    test("can convert game ID to mongo ID", () => {
        const id = idGenerator.makeHexStringFromID("89ABCDEF0011223301234567");
        expect(id).toEqual("0123456789ABCDEF00112233");
    });
    test("can generate many unique IDs at once", () => {
        const ids: {[id: string]: boolean} = {};
        for (let i = 0; i < 100000; i++) {
            const id = idGenerator.makeFrom(1569883975525, Math.random());
            if (ids[id]) {
                throw new Error("Generated ID was not unique");
            }
            ids[id] = true;
        }
    });
});
