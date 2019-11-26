import Entity from "entity";

export default class MapGenerator {
    public static proceed() {
        let i = 10;
        while (i > 0 && this._creationQueue.length > 0) {
            this._creationQueue.pop()!();
            i--;
        }
    }
    public static createGrassIsland(x: number, y: number, width: number, height: number) {
        this._createIsland(
            x, y, width, height, (i: number, j: number) => {
                const ent2 = this._generateBox(i, j);
                ent2.add(
                    "display",
                    "display",
                    undefined,
                    "R000000000000000000000003",
                    32,
                    j === y ? 0 : 32,
                    32,
                    32
                );
            }
        );
    }
    public static createLakeIsland(x: number, y: number, width: number, height: number) {
        this._createIsland(
            x, y, width, height, (i: number, j: number) => {
                const relativeJ = (j - y) / 32;
                const lakeLeft = (x - 32 * width / 2) + 64 + (relativeJ * relativeJ / 2) * 32;
                const lakeRight = (x + 32 * width / 2) - 64 - (relativeJ * relativeJ / 2) * 32;
                const lakeBottom = (y + 32 * height - 32);
                // global.log(`[${i}, ${j}] => ${lakeLeft} - ${lakeRight}, < ${lakeBottom}`);
                if (i > lakeLeft && i < lakeRight && j < lakeBottom) {
                    const ent2 = this._generateBox(i, j, false);
                    const display = ent2.add(
                        "display",
                        "display",
                        undefined,
                        "R000000000000000000000005",
                        256,
                        0,
                        32,
                        32
                    );
                    display.depth = -1;
                    ent2.add(
                        "water",
                        "water",
                        undefined
                    );
                    if (j === y) {
                        ent2.add(
                            "water-animation",
                            "water-animation",
                            undefined
                        );
                    }
                }
                else {
                    const ent2 = this._generateBox(i, j);
                    ent2.add(
                        "display",
                        "display",
                        undefined,
                        "R000000000000000000000003",
                        32,
                        j === y ? 0 : 32,
                        32,
                        32
                    );
                }
            }
        );
    }
    public static createIceIsland(x: number, y: number, width: number, height: number) {
        this._createIsland(
            x, y, width, height, (i: number, j: number) => {
                const ent2 = this._generateBox(i, j);
                ent2.add(
                    "display",
                    "display",
                    undefined,
                    "R000000000000000000000003",
                    128,
                    0,
                    32,
                    32
                );
                ent2.add(
                    "ice",
                    "ice",
                    undefined
                );
            }
        );
    }
    public static createLavaIsland(x: number, y: number, width: number, height: number) {
        this._createIsland(
            x, y, width, height, (i: number, j: number) => {
                const ent2 = this._generateBox(i, j);
                ent2.add(
                    "display",
                    "display",
                    undefined,
                    "R000000000000000000000003",
                    160,
                    0,
                    32,
                    32
                );
                ent2.add(
                    "lava",
                    "lava",
                    undefined
                );
            }
        );
    }
    private static _creationQueue: Array<() => void> = [];
    private static _createIsland(
            x: number,
            y: number,
            width: number,
            height: number,
            create: (x: number, y: number) => void) {
        const hRadius = 32 * width * 0.5;
        const tileHeight = 32 * height;
        for (let j = y; j < y + tileHeight; j += 32) {
            const relativeJ = (j - y) / 32;
            const offset = Math.floor(relativeJ * relativeJ / 4) * 32;
            this._creationQueue.push(() => {
                for (let i = x - hRadius + offset; i < x + hRadius - offset; i += 32) {
                    create(i, j);
                }
            });
        }
    }
    private static _generateBox(x: number, y: number, solid: boolean = true) {
        const entity = Entity.create("");
        entity.add("position", "position", undefined, x, y);
        entity.add("collision-box", "collision-box", undefined, 0, 0, 32, 32, true, solid);
        return entity;
    }
}
