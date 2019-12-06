import GameSystem from "core/systems/game-system";
import _Collection from "database/collection";
import path from "path";

jest.mock("database/collection");

// tslint:disable-next-line: variable-name
const Collection = _Collection as jest.Mock<_Collection>;

let gameSystem!: GameSystem;
let collections!: {[name: string]: _Collection};
let generatedChunkCollection!: _Collection;

describe("GameSystem", () => {
    beforeEach(() => {
        collections = {
            objects: new Collection(),
            references: new Collection(),
            entityReferences: new Collection(),
            playerReferences: new Collection(),
            componentInfoReferences: new Collection()
        };
        generatedChunkCollection = new Collection();
        gameSystem = new GameSystem(
            60,
            path.join(process.cwd(), "scripts"),
            [
                "export-values.ts",
                "object-serializer.ts",
                "proxy-generator.ts",
                "quadtree-grid.ts",
                "quadtree.ts",
                "scripted-server-subsystem.ts",
                "serialized-object-collection.ts"
            ],
            collections,
            generatedChunkCollection
        );
    });
});
