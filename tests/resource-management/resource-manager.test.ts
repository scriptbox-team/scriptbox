import _Player from "core/players/player";
import _ResourceServer from "networking/resource-server";
import Resource, { ResourceType } from "resource-management/resource";
import ResourceManager from "resource-management/resource-manager";

jest.mock("core/players/player");
jest.mock("networking/resource-server");
// tslint:disable-next-line: variable-name
const ResourceServer = _ResourceServer as jest.Mock<_ResourceServer>;
// tslint:disable-next-line: variable-name
const Player = _Player as jest.Mock<_Player>;

Date.now = jest.fn(() => 1000000);

let resourceManager!: ResourceManager;
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

Player.mockImplementation((...args: any) => {
    return {
        id: 0,
        controllingEntity: null,
        controlSet: {},
        username: "testPlayerUsername",
        displayName: "Test Player"
    } as any;
});

beforeEach(() => {
    ResourceServer.mockReset();
    resourceManager = new ResourceManager({serverPort: "7778", resourcePath: "."});
    resourceManager.setPlayerToken(new Player(), 123);
    (resourceManager as any)._resources.set("testPlayerUsername.12", new Resource(
        "testPlayerUsername.12",
        ResourceType.Script,
        "testFile",
        "testPlayerUsername",
        "",
        1000000,
        "",
        []
    ));
    (resourceManager as any)._playerResourceData.set("testPlayerUsername", {
        nextResourceID: 13,
        resources: [
            "testPlayerUsername.12"
        ]
    });
    resourceServer = (resourceManager as any)._resourceServer;
});

describe("Resource Manager", () => {
    test("Can handle resource addition", () => {
        const add = jest.fn();
        ResourceServer.mock.instances[0].add = add;
        resourceManager.handleFileUpload(123, file);
        expect(add).toBeCalledTimes(1);
        expect(add.mock.calls[0][0]).toEqual(new Resource(
            "testPlayerUsername.13",
            ResourceType.Script,
            "testFile",
            "testPlayerUsername",
            "",
            1000000,
            "",
            []
        ));
        expect(add.mock.calls[0][1]).toEqual(file);
    });
    test("Can handle resource updating", () => {
        const update = jest.fn();
        ResourceServer.mock.instances[0].update = update;
        resourceManager.handleFileUpload(123, file, "testPlayerUsername.12");
        expect(update).toBeCalledTimes(1);
        expect(update.mock.calls[0][0]).toEqual(new Resource(
            "testPlayerUsername.12",
            ResourceType.Script,
            "testFile",
            "testPlayerUsername",
            "",
            1000000,
            "",
            []
        ));
        expect(update.mock.calls[0][1]).toEqual(file);
    });
    test("Can handle resource removal", () => {
        const remove = jest.fn();
        ResourceServer.mock.instances[0].delete = remove;
        resourceManager.handleFileDelete(123, "testPlayerUsername.12");
        expect(remove).toBeCalledTimes(1);
        expect(remove.mock.calls[0][0]).toEqual(new Resource(
            "testPlayerUsername.12",
            ResourceType.Script,
            "testFile",
            "testPlayerUsername",
            "",
            1000000,
            "",
            []
        ));
    });
});
