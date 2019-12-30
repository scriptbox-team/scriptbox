import Client from "core/client";
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
        gameSystem.setMapGenState(false);
    });
    test("can create a player", async () => {
        const client = new Client("P123456789012345678901234", 0, "testclient", "test client");
        gameSystem.createPlayer(client);
        const updateResult = gameSystem.update();
        expect(Object.keys(updateResult.entities).length).toBe(1);
        expect(Object.keys(updateResult.players).length).toBe(1);
    });
});
