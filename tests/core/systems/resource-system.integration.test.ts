import Client from "core/client";
import IDGenerator from "core/id-generator";
import ResourceSystem from "core/systems/resource-system";
import _Collection from "database/collection";
import _ResourceServer from "networking/resource-server";
import Resource, { ResourceType } from "resource-management/resource";

jest.mock("networking/resource-server");
// tslint:disable-next-line: variable-name
const ResourceServer = _ResourceServer as jest.Mock<_ResourceServer>;

// tslint:disable-next-line: variable-name
const Collection = _Collection as jest.Mock<_Collection>;

Date.now = jest.fn(() => 1000000);

let resourceSystem!: ResourceSystem;
let resourceServer!: jest.Mock<_ResourceServer>;
let collection!: _Collection;

const file = {
    name: "testFile",
    encoding: "utf8",
    mimetype: "text/plain",
    data: Buffer.from("test text"),
    size: 9,
    tempFilePath: "",
    truncated: false,
    md5: "some MD5",
    mv: {} as any
};

let token!: number;

describe("Resource System", () => {
    beforeEach(() => {
        const client = new Client("P123456789012345678901234", 0, "testPlayer", "Test Player");
        ResourceServer.mockReset();
        collection = new Collection();
        collection.insert({
            id: "testID",
            type: ResourceType.Script,
            name: "testFile",
            filename: "testFile.ts",
            creator: "testCreatorUsername",
            owner: "testPlayerUsername",
            description: "",
            time: 1000000,
            icon: "",
            shared: false
        });
        resourceSystem = new ResourceSystem(
            new IDGenerator(0),
            collection,
            {serverPort: "7778", resourcePath: "."}
        );
        token = resourceSystem.makePlayerToken(client);
        resourceServer = (resourceSystem as any)._resourceServer;
    });

    test("Can handle resource addition", () => {
        const add = jest.fn();
        ResourceServer.mock.instances[0].add = add;
        resourceSystem.handleFileUpload(token, file);
        expect(add).toBeCalledTimes(1);
        expect(add.mock.calls[0][0]).toEqual(new Resource(
            "R123456789012345678901234",
            ResourceType.Script,
            "testFile",
            "testFile.ts",
            "testPlayerUsername",
            "testPlayerUsername",
            "",
            1000000,
            "",
            false
        ));
        expect(add.mock.calls[0][1]).toEqual(file);
    });
    test("Can handle resource updating", async () => {
        const update = jest.fn();
        ResourceServer.mock.instances[0].update = update;
        await resourceSystem.handleFileUpload(token, file, "testID");
        expect(update).toBeCalledTimes(1);
        expect(update.mock.calls[0][0]).toEqual(new Resource(
            "testID",
            ResourceType.Script,
            "testFile",
            "testFile.ts",
            "testCreatorUsername",
            "testPlayerUsername",
            "",
            1000000,
            "",
            false
        ));
        expect(update.mock.calls[0][1]).toEqual(file);
    });
    test("Can handle resource removal", () => {
        const remove = jest.fn();
        ResourceServer.mock.instances[0].delete = remove;
        resourceSystem.handleFileDelete(token, "testID");
        resourceSystem.deleteQueued();
        expect(remove).toBeCalledTimes(1);
        expect(remove.mock.calls[0][0]).toEqual(new Resource(
            "testID",
            ResourceType.Script,
            "testFile",
            "testFile.ts",
            "testCreatorUsername",
            "testPlayerUsername",
            "",
            1000000,
            "",
            false
        ));
    });
});