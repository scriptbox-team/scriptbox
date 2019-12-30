import Manager from "core/manager";

interface TestObject {
    id: string;
    info: string;
}

describe("Manager", () => {
    test("can retrieve items", () => {
        const manager = new Manager<TestObject>(
            (id: string, info: string) => {
                return {id, info};
            }
        );
        (manager as any)._items = new Map<string, TestObject>(
            [
                ["test1", {id: "test1", info: "A test object"}],
                ["test2", {id: "test2", info: "Another test object"}]
            ]
        );
        const item = manager.get("test2");
        expect(item).toEqual({id: "test2", info: "Another test object"});
    });

    test("will return undefined if item to retrieve doesn't exist", () => {
        const manager = new Manager<TestObject>(
            (id: string, info: string) => {
                return {id, info};
            }
        );
        (manager as any)._items = new Map<string, TestObject>(
            [
                ["test1", {id: "test1", info: "A test object"}],
                ["test2", {id: "test2", info: "Another test object"}]
            ]
        );
        const item = manager.get("test3");
        expect(item).toEqual(undefined);
    });

    test("can check if an item exists", () => {
        const manager = new Manager<TestObject>(
            (id: string, info: string) => {
                return {id, info};
            }
        );
        (manager as any)._items = new Map<string, TestObject>(
            [
                ["test1", {id: "test1", info: "A test object"}],
                ["test2", {id: "test2", info: "Another test object"}]
            ]
        );
        expect(manager.has("test2")).toBeTruthy();
    });

    test("can check if an item doesn't exist", () => {
        const manager = new Manager<TestObject>(
            (id: string, info: string) => {
                return {id, info};
            }
        );
        (manager as any)._items = new Map<string, TestObject>(
            [
                ["test1", {id: "test1", info: "A test object"}],
                ["test2", {id: "test2", info: "Another test object"}]
            ]
        );
        expect(manager.has("test3")).toBeFalsy();
    });

    test("can get iterator of entries", () => {
        const manager = new Manager<TestObject>(
            (id: string, info: string) => {
                return {id, info};
            }
        );
        (manager as any)._items = new Map<string, TestObject>(
            [
                ["test1", {id: "test1", info: "A test object"}],
                ["test2", {id: "test2", info: "Another test object"}]
            ]
        );
        expect(manager.entries()).toEqual((manager as any)._items.entries());
    });

    test("can create items", () => {
        const manager = new Manager<TestObject>(
            (id: string, info: string) => {
                return {id, info};
            }
        );
        const obj = manager.create("testID", "A test object");
        expect(obj).toEqual({id: "testID", info: "A test object"});
    });

    test("can force delete items", () => {
        const manager = new Manager<TestObject>(
            (id: string, info: string) => {
                return {id, info};
            }
        );
        (manager as any)._items = new Map<string, TestObject>(
            [
                ["test1", {id: "test1", info: "A test object"}],
                ["test2", {id: "test2", info: "Another test object"}]
            ]
        );
        manager.forceDelete("test1");
        expect((manager as any)._items).toEqual(
            new Map<string, TestObject>(
                [
                    ["test2", {id: "test2", info: "Another test object"}]
                ]
            )
        );
    });

    test("can run callback function on force delete", () => {
        const testDeleteCallback = jest.fn();
        const manager = new Manager<TestObject>(
            (id: string, info: string) => {
                return {id, info};
            },
            testDeleteCallback
        );
        (manager as any)._items = new Map<string, TestObject>(
            [
                ["test1", {id: "test1", info: "A test object"}],
                ["test2", {id: "test2", info: "Another test object"}]
            ]
        );
        manager.forceDelete("test1", "someParam", 3);
        expect(testDeleteCallback).toBeCalledTimes(1);
        expect(testDeleteCallback.mock.calls[0][0]).toEqual({id: "test1", info: "A test object"});
        expect(testDeleteCallback.mock.calls[0][1]).toEqual("someParam");
        expect(testDeleteCallback.mock.calls[0][2]).toEqual(3);
    });

    test("can queue items for later deletion", () => {
        const manager = new Manager<TestObject>(
            (id: string, info: string) => {
                return {id, info};
            }
        );
        (manager as any)._items = new Map<string, TestObject>(
            [
                ["test1", {id: "test1", info: "A test object"}],
                ["test2", {id: "test2", info: "Another test object"}]
            ]
        );
        manager.queueForDeletion("test1");
        expect((manager as any)._items).toEqual(
            new Map<string, TestObject>(
                [
                    ["test1", {id: "test1", info: "A test object"}],
                    ["test2", {id: "test2", info: "Another test object"}]
                ]
            )
        );
        expect((manager as any)._deletionQueue).toEqual([{id: "test1", args: []}]);
    });

    test("can delete items queued for deletion", () => {
        const manager = new Manager<TestObject>(
            (id: string, info: string) => {
                return {id, info};
            }
        );
        (manager as any)._items = new Map<string, TestObject>(
            [
                ["test1", {id: "test1", info: "A test object"}],
                ["test2", {id: "test2", info: "Another test object"}],
                ["test3", {id: "test3", info: "Yet another test object"}]
            ]
        );
        (manager as any)._deletionQueue = [{id: "test1", args: []}, {id: "test3", args: []}];
        manager.deleteQueued();
        expect((manager as any)._items).toEqual(
            new Map<string, TestObject>(
                [
                    ["test2", {id: "test2", info: "Another test object"}]
                ]
            )
        );
    });

    test("can run callback function on queued deletion", () => {
        const testDeleteCallback = jest.fn();
        const manager = new Manager<TestObject>(
            (id: string, info: string) => {
                return {id, info};
            },
            testDeleteCallback
        );
        (manager as any)._items = new Map<string, TestObject>(
            [
                ["test1", {id: "test1", info: "A test object"}],
                ["test2", {id: "test2", info: "Another test object"}],
                ["test3", {id: "test3", info: "Yet another test object"}]
            ]
        );
        (manager as any)._deletionQueue = [
            {id: "test1", args: ["someArg", 2]},
            {id: "test3", args: ["someOtherArg", 4]}
        ];
        manager.deleteQueued();
        expect(testDeleteCallback).toBeCalledTimes(2);
        expect(testDeleteCallback.mock.calls[0][0]).toEqual({id: "test1", info: "A test object"});
        expect(testDeleteCallback.mock.calls[0][1]).toEqual("someArg");
        expect(testDeleteCallback.mock.calls[0][2]).toEqual(2);
        expect(testDeleteCallback.mock.calls[1][0]).toEqual({id: "test3", info: "Yet another test object"});
        expect(testDeleteCallback.mock.calls[1][1]).toEqual("someOtherArg");
        expect(testDeleteCallback.mock.calls[1][2]).toEqual(4);
    });
});
