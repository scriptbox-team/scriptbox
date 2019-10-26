import _Client from "core/client";
import _IDGenerator from "core/id-generator";
import ResourceSystem from "core/systems/resource-system";
import _ResourceServer from "networking/resource-server";
import Resource, { ResourceType } from "resource-management/resource";

jest.mock("core/client");
jest.mock("core/id-generator");
jest.mock("networking/resource-server");
// tslint:disable-next-line: variable-name
const ResourceServer = _ResourceServer as jest.Mock<_ResourceServer>;
// tslint:disable-next-line: variable-name
const Client = _Client as jest.Mock<_Client>;

// tslint:disable-next-line: variable-name
const IDGenerator = _IDGenerator as jest.Mock<_IDGenerator>;
// tslint:disable-next-line: variable-name

Date.now = jest.fn(() => 1000000);

let resourceSystem!: ResourceSystem;
let resourceServer!: jest.Mock<_ResourceServer>;

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

Client.mockImplementation((...args: any) => {
    return {
        id: 0,
        controllingEntity: null,
        controlSet: {},
        username: "testPlayerUsername",
        displayName: "Test Player"
    } as any;
});

IDGenerator.mockImplementation((...args: any): any => {
    return {
        counter: 0,
        counterMax: 0,
        nextCounterValue: () => {},
        randomMax: () => {},
        makeFromHexString: () => {},
        makeHexStringFromID: () => {},
        makeFrom: (prefix: string, time: number, seed: number) => {
            return "R123456789012345678901234";
        }
    };
});

let token!: number;

beforeEach(() => {
    ResourceServer.mockReset();
    resourceSystem = new ResourceSystem(new IDGenerator(), {serverPort: "7778", resourcePath: "."});
    token = resourceSystem.makePlayerToken(new Client());
    (resourceSystem as any)._resourceManager._items.set("testID", new Resource(
        "testID",
        ResourceType.Script,
        "testFile",
        "testCreatorUsername",
        "testPlayerUsername",
        "",
        1000000,
        ""
    ));
    (resourceSystem as any)._playerResourceData.set("testPlayerUsername", {
        resources: [
            "testID"
        ]
    });
    resourceServer = (resourceSystem as any)._resourceServer;
});

describe("Resource Server", () => {
    test("Can handle resource addition", () => {
        const add = jest.fn();
        ResourceServer.mock.instances[0].add = add;
        resourceSystem.handleFileUpload(token, file);
        expect(add).toBeCalledTimes(1);
        expect(add.mock.calls[0][0]).toEqual(new Resource(
            "R123456789012345678901234",
            ResourceType.Script,
            "testFile",
            "testPlayerUsername",
            "testPlayerUsername",
            "",
            1000000,
            ""
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
            "testCreatorUsername",
            "testPlayerUsername",
            "",
            1000000,
            ""
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
            "testCreatorUsername",
            "testPlayerUsername",
            "",
            1000000,
            ""
        ));
    });
});
