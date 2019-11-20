import QuadtreeGrid from "quadtree-grid";
import DirectionFlipper from "direction-flipper";

interface BoundingBox {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}

interface CollisionBoxInfo {
    id: string;
    static: boolean;
    dense: boolean;
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
    result: {
        penetration: Penetration[];
    };
}

interface Penetration {
    x: number;
    y: number;
    direction: "up" | "down" | "left" | "right";
}

interface Collision {
    primaryObj: string;
    primaryObjNewPos: Vector;
    secondaryObjs: Array<{
        id: string,
        dense: boolean,
        direction?: "up" | "down" | "left" | "right"
    }>;
}

export default class CollisionDetector {
    private _lastHitboxes: {[id: string]: CollisionBoxInfo};
    public check(boxes: CollisionBoxInfo[], collisionHandle: (obj1: string, obj2: string) => boolean) {
        const boxesByID: {[id: string]: CollisionBoxInfo} = {};
        for (const box of boxes) {
            boxesByID[box.id] = box;
        }
        const [staticBoxes, dynamicBoxes] = boxes
            .reduce((acc, box) => {
                acc[box.static ? 0 : 1].push(box);
                return acc;
            }, [[], []] as [CollisionBoxInfo[], CollisionBoxInfo[]]);

        const staticCollisionBoxes = staticBoxes.map((box) => {
                return {
                    id: box.id,
                    x1: box.bounds.x1,
                    y1: box.bounds.y1,
                    x2: box.bounds.x2,
                    y2: box.bounds.y2
                };
            });
        const staticGrid = new QuadtreeGrid(staticCollisionBoxes, 400, 5);
        const firstCollisions = this._handleCollisions(boxesByID, staticGrid, dynamicBoxes, collisionHandle);
        for (const collision of firstCollisions) {
            boxesByID[collision.primaryObj].bounds = {
                x1: boxesByID[collision.primaryObj].bounds.x1 + collision.primaryObjNewPos.x,
                y1: boxesByID[collision.primaryObj].bounds.y1 + collision.primaryObjNewPos.y,
                x2: boxesByID[collision.primaryObj].bounds.x2 + collision.primaryObjNewPos.x,
                y2: boxesByID[collision.primaryObj].bounds.y2 + collision.primaryObjNewPos.y
            };
        }

        const dynamicCollisionBoxes = dynamicBoxes.map((box) => {
            return {
                id: box.id,
                x1: box.bounds.x1,
                y1: box.bounds.y1,
                x2: box.bounds.x2,
                y2: box.bounds.y2
            };
        });
        const dynamicGrid = new QuadtreeGrid(dynamicCollisionBoxes, 400, 5);
        const secondCollisions = this._handleCollisions(boxesByID, dynamicGrid, dynamicBoxes, collisionHandle);
        const boxesToRecheck = [];
        for (const collision of secondCollisions) {
            if (collision.primaryObjNewPos.x !== 0 || collision.primaryObjNewPos.y !== 0) {
                boxesToRecheck.push(boxesByID[collision.primaryObj]);
            }
            boxesByID[collision.primaryObj].bounds = {
                x1: boxesByID[collision.primaryObj].bounds.x1 + collision.primaryObjNewPos.x,
                y1: boxesByID[collision.primaryObj].bounds.y1 + collision.primaryObjNewPos.y,
                x2: boxesByID[collision.primaryObj].bounds.x2 + collision.primaryObjNewPos.x,
                y2: boxesByID[collision.primaryObj].bounds.y2 + collision.primaryObjNewPos.y
            };
        }

        const recheckCollisions = this._handleCollisions(boxesByID, staticGrid, boxesToRecheck, collisionHandle);
        for (const collision of recheckCollisions) {
            boxesByID[collision.primaryObj].bounds = {
                x1: boxesByID[collision.primaryObj].bounds.x1 + collision.primaryObjNewPos.x,
                y1: boxesByID[collision.primaryObj].bounds.y1 + collision.primaryObjNewPos.y,
                x2: boxesByID[collision.primaryObj].bounds.x2 + collision.primaryObjNewPos.x,
                y2: boxesByID[collision.primaryObj].bounds.y2 + collision.primaryObjNewPos.y
            };
        }
        this._lastHitboxes = boxesByID;
        return [...firstCollisions, ...secondCollisions, ...recheckCollisions];
    }

    private _handleCollisions(
            boxesByID: {[id: string]: CollisionBoxInfo},
            grid: QuadtreeGrid<{id: string, x1: number, y1: number, x2: number, y2: number}>,
            boxes: CollisionBoxInfo[],
            collisionHandle: (obj1: string, obj2: string) => boolean) {
        const collisionResults = [] as Collision[];
        const skip = new Map<string, Set<string>>();
        for (const box of boxes) {
            skip.set(box.id, new Set<string>());
            const collisions = grid.test(box.bounds, (storedBox) => {
                const box2 = boxesByID[storedBox.id];
                return this._testCollision(
                    box.bounds,
                    box2,
                    [box.id]
                );
            });
            if (collisions.length > 0) {
                const [denseCollisions, undenseCollisions] = collisions.reduce((acc, collision) => {
                    acc[collisionHandle(box.id, collision.box.id) ? 0 : 1].push(collision);
                    return acc;
                }, [[], []] as [QuadtreeTestResult[], QuadtreeTestResult[]]);
                for (const c of undenseCollisions) {
                    collisionResults.push({
                        primaryObj: box.id,
                        primaryObjNewPos: {
                            x: 0,
                            y: 0,
                        },
                        secondaryObjs: [{
                            id: c.box.id,
                            dense: false,
                            direction: undefined
                        }]
                    });
                }
                if (denseCollisions.length > 0) {
                    const sortedCollisions = denseCollisions
                        .sort((a, b) => this._maxMinPenetration(a, b));
                    for (const c of sortedCollisions) {
                        const box2 = boxesByID[c.box.id];
                        if (box2.static) {
                            const ev = this._findCollisionEvents(
                                boxesByID,
                                grid,
                                box,
                                box2,
                                c.result.penetration,
                                [],
                                collisionHandle
                            );
                            // If the collision succeeded, add it to the results and leave
                            // Otherwise try the next collision
                            if (ev.secondaryObjs[0].dense) {
                                collisionResults.push(ev);
                                break;
                            }
                        }
                        else if (skip.get(box2.id) === undefined || !skip.get(box2.id).has(box.id)) {
                            const [box1Offsets, box2Offsets] = c.result.penetration.reduce((arr, offset) => {
                                arr[0].push({
                                    x: offset.x * 0.31,
                                    y: offset.y * 0.31,
                                    direction: offset.direction
                                });
                                arr[1].push({
                                    x: offset.x * -0.31,
                                    y: offset.y * -0.31,
                                    direction: DirectionFlipper.flip(offset.direction)
                                });
                                return arr;
                            }, [[], []] as [Penetration[], Penetration[]]);
                            collisionResults.push(this._findCollisionEvents(
                                boxesByID,
                                grid,
                                box,
                                box2,
                                box1Offsets,
                                [box2.id],
                                collisionHandle
                            ));
                            collisionResults.push(this._findCollisionEvents(
                                boxesByID,
                                grid,
                                box2,
                                box,
                                box2Offsets,
                                [box.id],
                                collisionHandle
                            ));
                            skip.get(box.id).add(box2.id);
                        }
                    }
                }
            }
        }
        return collisionResults;
    }

// TODO: Use collision normal instead of "direction"

    private _findCollisionEvents(
            boxesByID: {[id: string]: CollisionBoxInfo},
            grid: QuadtreeGrid<{x1: number, y1: number, x2: number, y2: number, id: string}>,
            box: CollisionBoxInfo,
            box2: CollisionBoxInfo,
            offsets: Array<{x: number, y: number, direction: "up" | "down" | "left" | "right"}>,
            ignore: string[] = [],
            collisionHandle: (obj1: string, obj2: string) => boolean): Collision {
        const potentialCollisions: Collision[] = [];
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
                return this._testCollision(
                    newBox,
                    box3,
                    [box.id, box2.id].concat(ignore)
                );
            });
            const [denseCollisions, undenseCollisions] = secondaryCollisions.reduce((acc, collision) => {
                acc[collisionHandle(box.id, collision.box.id) ? 0 : 1].push(collision);
                return acc;
            }, [[], []] as [QuadtreeTestResult[], QuadtreeTestResult[]]);
            if (denseCollisions.length === 0) {
                // There was no collision after fixing the position
                // So this position is fine
                const secondaryObjs = [{
                    id: box2.id,
                    dense: true,
                    direction: DirectionFlipper.flip(offset.direction)
                }].concat(undenseCollisions.map((collision) => {
                    return {
                        id: collision.box.id,
                        dense: false,
                        direction: undefined
                    };
                }));
                return {
                    primaryObj: box.id,
                    primaryObjNewPos: {
                        x: offset.x * offsetExtra,
                        y: offset.y * offsetExtra
                    },
                    secondaryObjs
                };
            }
            else {
                const sortedCollisions = secondaryCollisions.sort((a, b) => this._maxMinPenetration(a, b));
                for (const c of sortedCollisions) {
                    const orderedSecondaryOffsets = c.result.penetration;
                    for (const secondaryOffset of [orderedSecondaryOffsets[0], orderedSecondaryOffsets[1]]) {
                        const newNewBox = {
                            x1: newBox.x1 + secondaryOffset.x * offsetExtra,
                            y1: newBox.y1 + secondaryOffset.y * offsetExtra,
                            x2: newBox.x2 + secondaryOffset.x * offsetExtra,
                            y2: newBox.y2 + secondaryOffset.y * offsetExtra,
                        };
                        const tertiaryCollisions = grid.test(newNewBox, (storedBox) => {
                            const box3 = boxesByID[storedBox.id];
                            return this._testCollision(
                                newNewBox,
                                box3,
                                [box.id, c.box.id].concat(ignore)
                            );
                        });
                        const [denseCollisions2, undenseCollisions2] = tertiaryCollisions.reduce((acc, collision) => {
                            acc[collisionHandle(box.id, collision.box.id) ? 0 : 1].push(collision);
                            return acc;
                        }, [[], []] as [QuadtreeTestResult[], QuadtreeTestResult[]]);
                        if (denseCollisions2.length === 0) {

                            const secondaryObjs = [
                                {
                                    id: box2.id,
                                    dense: true,
                                    direction: DirectionFlipper.flip(offset.direction)
                                },
                                {
                                    id: c.box.id,
                                    dense: true,
                                    direction: DirectionFlipper.flip(secondaryOffset.direction)
                                }
                            ]
                                .concat(undenseCollisions.map((collision) => {
                                    return {
                                        id: collision.box.id,
                                        dense: false,
                                        direction: undefined
                                    };
                                }))
                                .concat(undenseCollisions2.map((collision) => {
                                    return {
                                        id: collision.box.id,
                                        dense: false,
                                        direction: undefined
                                    };
                                }));

                            return {
                                primaryObj: box.id,
                                primaryObjNewPos: {
                                    x: offset.x + secondaryOffset.x * offsetExtra,
                                    y: offset.y + secondaryOffset.y * offsetExtra
                                },
                                secondaryObjs
                            };
                        }
                        // If there were collisions, proceed and try the other offset
                    }
                }
            }
            // If there were collisions, proceed and try the other offset
        }
        // A suitable place couldn't be found
        // Give up and don't correct the position of the object
        if (potentialCollisions.length === 0) {
            return {
                primaryObj: box.id,
                primaryObjNewPos: {
                    x: 0,
                    y: 0
                },
                secondaryObjs: [{
                    id: box2.id,
                    dense: false,
                    direction: undefined
                }]
            };
        }
        return potentialCollisions.reduce((currOffset, offset) => {
            return currOffset.primaryObjNewPos.x ** 2 + currOffset.primaryObjNewPos.y ** 2
                < offset.primaryObjNewPos.x ** 2 + offset.primaryObjNewPos.y ** 2
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
            box1: BoundingBox,
            box2: CollisionBoxInfo,
            skip: string[]) {
        // Collision detection using minkowski difference
        // Adapted from https://blog.hamaluik.ca/posts/simple-aabb-collision-using-minkowski-difference/
        if (skip.includes(box2.id)) {
            return undefined;
        }
        const diff = this._minkowskiDifference(box1, box2.bounds);
        if (diff.x1 < 0 && diff.y1 < 0 && diff.x2 > 0 && diff.y2 > 0) {
            return {
                penetration: this._getPenetrationVectors(diff, {x: 0, y: 0}).sort((a, b) => {
                    return (a.x * a.x + a.y * a.y) - (b.x * b.x + b.y * b.y);
                })
            };
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
        };
    }

    private _minkowskiDifference(box1: BoundingBox, box2: BoundingBox) {
        return {
            x1: box1.x1 - box2.x2,
            y1: box1.y1 - box2.y2,
            x2: box1.x2 - box2.x1,
            y2: box1.y2 - box2.y1,
        };
    }

    private _getPenetrationVectors(box: BoundingBox, origin: Vector): Penetration[] {
        const dirs = ["down", "left", "up", "right"] as Array<"up" | "right" | "down" | "left">;
        return this._getLines(box).map((line) => {
            const originLine = {x: origin.x, y: origin.y, vec: this._getNormal(line)};
            const [t, u] = this._getLineIntersections(originLine, line);
            if (t === undefined) {
                return undefined;
            }
            return {
                x: -originLine.vec.x * t,
                y: -originLine.vec.y * t,
                direction: dirs.shift()
            };
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
        if (a.result.penetration.length !== 0) {
            const minPen = a.result.penetration[0];
            aValue = minPen.x * minPen.x + minPen.y * minPen.y;
        }
        if (b.result.penetration.length !== 0) {
            const minPen = b.result.penetration[0];
            bValue = minPen.x * minPen.x + minPen.y * minPen.y;
        }
        return bValue - aValue;
    }
}
