import IDGenerator from "core/id-generator";
import ResourceSystem from "core/systems/resource-system";
import _Collection from "database/collection";
import JestExpress from "jest-express";
import { Express } from "jest-express/lib/express";

jest.mock("database/collection");
jest.mock("express", () => {
    return JestExpress;
});

// tslint:disable-next-line: variable-name
const Collection = _Collection as jest.Mock<_Collection>;

let resourceSystem!: ResourceSystem;
let resourceCollection: _Collection;

describe("ResourceSystem", () => {
    beforeEach(() => {
        resourceCollection = new Collection();
        resourceSystem = new ResourceSystem(
            new IDGenerator(Math.random()),
            resourceCollection,
            {
                serverPort: "7778",
                resourcePath: "./data/res/"
            }
        );
    });
});
