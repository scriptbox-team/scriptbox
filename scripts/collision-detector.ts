import QuadtreeGrid from "./quadtree-grid";

interface BoundingBox {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}

interface CollisionBoxInfo {
    id: string;
    static: boolean;
    teleport: boolean;
    bounds: BoundingBox;
}

interface Line {
    x: number;
    y: number;
    vec: Vector;
}

interface Vector {
    x: number;
    y: number;
}

interface QuadtreeTestResult {
    box: {
        id: string;
        x1: number;
        y1: number;
        x2: number;
        y2: number;
    };
    value: Vector[];
}

interface Collision {
    obj1: string;
    obj1NewPos: Vector;
    obj2: string;
    obj2NewPos: Vector;
}

export default class CollisionDetector {
    private _lastHitboxes: {[id: string]: CollisionBoxInfo};
    public check(boxes: CollisionBoxInfo[]) {
        const collisionResults: Collision[] = [];
        const boxesByID: {[id: string]: CollisionBoxInfo} = {};
        const boundingBoxes = boxes.map((box) => {
            return {
                id: box.id,
                x1: box.bounds.x1,
                y1: box.bounds.y1,
                x2: box.bounds.x2,
                y2: box.bounds.y2
            };
        });
        for (const box of boxes) {
            boxesByID[box.id] = box;
        }
        const grid = new QuadtreeGrid(boundingBoxes, 400, 5);
        for (const box of boxes) {
            if (!box.static) {
                const collisions = grid.test(box.bounds, (storedBox) => {
                    const box2 = boxesByID[storedBox.id];
                    const lastBounds = this._lastHitboxes[box.id] !== undefined
                        ? this._lastHitboxes[box.id].bounds : undefined;
                    return this._testCollision(
                        box.teleport ? lastBounds : undefined,
                        box.bounds,
                        box2.teleport ? this._lastHitboxes[box2.id] : undefined,
                        box2,
                        [box.id]
                    );
                });
                if (collisions.length > 0) {
                    const c = collisions.reduce((a, b) => this._maxMinPenetration(a, b));
                    if (c.value !== undefined) {
                        const box2 = boxesByID[c.box.id];
                        if (box2.static) {
                            collisionResults.push(
                                {
                                    obj1: box.id,
                                    obj1NewPos: this._findFinalBoxOffset(
                                        boxesByID,
                                        grid,
                                        box,
                                        box2,
                                        c.value
                                    ),
                                    obj2: box2.id,
                                    obj2NewPos: {x: 0, y: 0}
                                }
                            );
                        }
                        else {
                            const splitOffsets = c.value.reduce((arr, offset) => {
                                arr[0].push({x: offset.x / 2, y: offset.x / 2});
                                arr[1].push({x: offset.x / -2, y: offset.x / -2});
                                return arr;
                            }, [[], []] as [Array<{x: number, y: number}>, Array<{x: number, y: number}>]);
                            collisionResults.push(
                                {
                                    obj1: box.id,
                                    obj1NewPos: this._findFinalBoxOffset(
                                        boxesByID,
                                        grid,
                                        box,
                                        box2,
                                        splitOffsets[0]
                                    ),
                                    obj2: box2.id,
                                    obj2NewPos: this._findFinalBoxOffset(
                                        boxesByID,
                                        grid,
                                        box2,
                                        box,
                                        splitOffsets[1]
                                    )
                                }
                            );
                        }
                    }
                }
            }
        }
        this._lastHitboxes = boxesByID;
        return collisionResults;
    }

    private _findFinalBoxOffset(
            boxesByID: {[id: string]: CollisionBoxInfo},
            grid: QuadtreeGrid<{x1: number, y1: number, x2: number, y2: number, id: string}>,
            box: CollisionBoxInfo,
            box2: CollisionBoxInfo,
            offsets: Array<{x: number, y: number}>,
            ignore: string[] = []) {
        const potentialOffsets = [];
        const offsetExtra = 1;
        for (const offset of [offsets[0], offsets[1]]) {
            const newBox = {
                x1: box.bounds.x1 + offset.x * offsetExtra,
                y1: box.bounds.y1 + offset.y * offsetExtra,
                x2: box.bounds.x2 + offset.x * offsetExtra,
                y2: box.bounds.y2 + offset.y * offsetExtra,
            };
            const secondaryCollisions = grid.test(newBox, (storedBox) => {
                const box3 = boxesByID[storedBox.id];
                const lastBounds = this._lastHitboxes[box.id] !== undefined
                    ? this._lastHitboxes[box.id].bounds : undefined;
                return this._testCollision(
                    box.teleport ? lastBounds : undefined,
                    newBox,
                    box3.teleport ? this._lastHitboxes[box3.id] : undefined,
                    box3,
                    [box.id, box2.id].concat(ignore)
                );
            });
            if (secondaryCollisions.length === 0) {
                // There was no collision after fixing the position
                // So this position is fine
                potentialOffsets.push({
                    x: offset.x * offsetExtra,
                    y: offset.y * offsetExtra
                });
            }
            else {
                const c = secondaryCollisions.reduce((a, b) => this._maxMinPenetration(a, b));
                const orderedSecondaryOffsets = c.value;
                for (const secondaryOffset of [orderedSecondaryOffsets[0], orderedSecondaryOffsets[1]]) {
                    const newNewBox = {
                        x1: newBox.x1 + secondaryOffset.x * offsetExtra,
                        y1: newBox.y1 + secondaryOffset.y * offsetExtra,
                        x2: newBox.x2 + secondaryOffset.x * offsetExtra,
                        y2: newBox.y2 + secondaryOffset.y * offsetExtra,
                    };
                    const tertiaryCollisions = grid.test(newNewBox, (storedBox) => {
                        const box3 = boxesByID[storedBox.id];
                        const lastBounds = this._lastHitboxes[box.id] !== undefined
                            ? this._lastHitboxes[box.id].bounds : undefined;
                        return this._testCollision(
                            box.teleport ? lastBounds : undefined,
                            newNewBox,
                            box3.teleport ? this._lastHitboxes[box3.id] : undefined,
                            box3,
                            [box.id, c.box.id].concat(ignore)
                        );
                    });
                    if (tertiaryCollisions.length === 0) {
                        potentialOffsets.push({
                            x: offset.x + secondaryOffset.x * offsetExtra,
                            y: offset.y + secondaryOffset.y * offsetExtra
                        });
                    }
                    // If there were collisions, proceed and try the other offset
                }
            }
            // If there were collisions, proceed and try the other offset
        }
        // A suitable place couldn't be found
        // Give up and don't correct the position of the object
        if (potentialOffsets.length === 0) {
            return {x: 0, y: 0};
        }
        return potentialOffsets.reduce((currOffset, offset) => {
            return currOffset.x ** 2 + currOffset.y ** 2 < offset.x ** 2 + offset.y ** 2
                ? currOffset : offset;
        });
    }

    private _clampVector(a: Vector, b: Vector | undefined) {
        if (b === undefined) {
            return a;
        }
        const x = b.x < 0 ? Math.min(0, Math.max(b.x, a.x)) : Math.max(0, Math.min(b.x, a.x));
        const y = b.y < 0 ? Math.min(0, Math.max(b.y, a.y)) : Math.max(0, Math.min(b.y, a.y));
        return {x, y};
    }

    private _testCollision(
            box1Prev: BoundingBox | undefined,
            box1: BoundingBox,
            box2Prev: CollisionBoxInfo | undefined,
            box2: CollisionBoxInfo,
            skip: string[]) {
        // Collision detection using minkowski difference
        // Adapted from https://blog.hamaluik.ca/posts/simple-aabb-collision-using-minkowski-difference/
        if (skip.includes(box2.id)) {
            return undefined;
        }
        const diff = this._minkowskiDifference(box1, box2.bounds);
        if (diff.x1 < 0 && diff.y1 < 0 && diff.x2 > 0 && diff.y2 > 0) {
            return this._getPenetrationVectors(diff, {x: 0, y: 0}).sort((a, b) => {
                return (a.x * a.x + a.y * a.y) - (b.x * b.x + b.y * b.y);
            });
        }
        return undefined;
    }

    private _getBoxCenter(box: BoundingBox) {
        return {
            x: box.x1 + box.x2 / 2,
            y: box.y1 + box.y2 / 2
        };
    }

    private _getMovementVector(box1: BoundingBox, box2: BoundingBox) {
        const box1Mid = this._getBoxCenter(box1);
        const box2Mid = this._getBoxCenter(box2);
        return {
            x: box2Mid.x - box1Mid.x,
            y: box2Mid.y - box1Mid.y
        }
    }

    private _minkowskiDifference(box1: BoundingBox, box2: BoundingBox) {
        return {
            x1: box1.x1 - box2.x2,
            y1: box1.y1 - box2.y2,
            x2: box1.x2 - box2.x1,
            y2: box1.y2 - box2.y1,
        };
    }

    private _getPenetrationVectors(box: BoundingBox, origin: Vector) {
        return this._getLines(box).map((line) => {
            const originLine = {x: origin.x, y: origin.y, vec: this._getNormal(line)};
            const [t, u] = this._getLineIntersections(originLine, line);
            if (t === undefined) {
                return undefined;
            }
            return {x: -originLine.vec.x * t, y: -originLine.vec.y * t};
        })
            .filter((val) => val !== undefined);
    }

    private _getLines(box: BoundingBox) {
        return [
            {x: box.x1, y: box.y1, vec: {x: box.x2 - box.x1, y: 0}},
            {x: box.x2, y: box.y1, vec: {x: 0, y: box.y2 - box.y1}},
            {x: box.x2, y: box.y2, vec: {x: box.x1 - box.x2, y: 0}},
            {x: box.x1, y: box.y2, vec: {x: 0, y: box.y1 - box.y2}},
        ] as Line[];
    }

    private _getNormal(line: Line) {
        const distVec = {
            x: line.vec.y,
            y: -line.vec.x
        };
        const dist = Math.sqrt(distVec.x * distVec.x + distVec.y * distVec.y);
        return {
            x: distVec.x / dist,
            y: distVec.y / dist
        };
    }

    private _getLineIntersections(line1: Line, line2: Line) {
        const val = (line1.vec.y * line2.vec.x - line1.vec.x * line2.vec.y);
        if (val === 0) {
            return [undefined, undefined];
        }
        const t = ((line2.x - line1.x) * line2.vec.y + (line1.y - line2.y) * line2.vec.x) / -val;
        const u = ((line1.x - line2.x) * line1.vec.y + (line2.y - line1.y) * line1.vec.x) / val;
        return [t, u];
    }

    private _wrapBoxes(box) {
        const lastBox = this._lastHitboxes[box.id];
        if (lastBox !== undefined && !box.teleport) {
            return {
                id: box.id,
                x1: Math.min(box.bounds.x1, lastBox.bounds.x1),
                y1: Math.min(box.bounds.y1, lastBox.bounds.y1),
                x2: Math.max(box.bounds.x2, lastBox.bounds.x2),
                y2: Math.max(box.bounds.y2, lastBox.bounds.y2)
            };
        }
        return {
            id: box.id,
            x1: box.bounds.x1,
            y1: box.bounds.y1,
            x2: box.bounds.x2,
            y2: box.bounds.y2
        };
    }

    private _maxMinPenetration(a: QuadtreeTestResult, b: QuadtreeTestResult) {
        let aValue = -1;
        let bValue = -1;
        if (a.value.length !== 0) {
            const minPen = a.value[0];
            aValue = minPen.x * minPen.x + minPen.y * minPen.y;
        }
        if (b.value.length !== 0) {
            const minPen = b.value[0];
            bValue = minPen.x * minPen.x + minPen.y * minPen.y;
        }
        return aValue > bValue ? a : b;
    }
}
