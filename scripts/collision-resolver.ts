import CollisionDetector from "collision-detector";
import DirectionFlipper from "direction-flipper";
import QuadtreeGrid from "quadtree-grid";

interface BoundingBox {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}

interface IDBoundingBox extends BoundingBox {
    id: string;
}

interface CollisionBoxInfo {
    id: string;
    static: boolean;
    dense: boolean;
    bounds: BoundingBox;
}

interface Vector {
    x: number;
    y: number;
}

interface QuadtreeTestResult {
    box: IDBoundingBox;
    result: {
        penetration: Penetration[];
    };
}

interface Penetration {
    x: number;
    y: number;
    direction?: "up" | "down" | "left" | "right";
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

export default class CollisionResolver {
    private _lastHitboxes: {[id: string]: CollisionBoxInfo} = {};
    public makeGrids(
            boxes: CollisionBoxInfo[]): {static: QuadtreeGrid<IDBoundingBox>, dynamic: QuadtreeGrid<IDBoundingBox>} {
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
        return {static: staticGrid, dynamic: dynamicGrid};
    }
    public check(
            grids: {static: QuadtreeGrid<IDBoundingBox>, dynamic: QuadtreeGrid<IDBoundingBox>},
            boxes: CollisionBoxInfo[],
            collisionHandle: (obj1: string, obj2: string) => boolean) {
        const boxesByID: {[id: string]: CollisionBoxInfo} = {};
        for (const box of boxes) {
            boxesByID[box.id] = box;
        }
        const [staticBoxes, dynamicBoxes] = boxes
            .reduce((acc, box) => {
                acc[box.static ? 0 : 1].push(box);
                return acc;
            }, [[], []] as [CollisionBoxInfo[], CollisionBoxInfo[]]);

        const staticGrid = grids.static;
        const firstCollisions = this._handleCollisions(boxesByID, staticGrid, dynamicBoxes, collisionHandle);
        for (const collision of firstCollisions) {
            boxesByID[collision.primaryObj].bounds = {
                x1: boxesByID[collision.primaryObj].bounds.x1 + collision.primaryObjNewPos.x,
                y1: boxesByID[collision.primaryObj].bounds.y1 + collision.primaryObjNewPos.y,
                x2: boxesByID[collision.primaryObj].bounds.x2 + collision.primaryObjNewPos.x,
                y2: boxesByID[collision.primaryObj].bounds.y2 + collision.primaryObjNewPos.y
            };
        }

        const dynamicGrid = grids.dynamic;
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
            boxesByID: {[id: string]: CollisionBoxInfo | undefined},
            grid: QuadtreeGrid<{id: string, x1: number, y1: number, x2: number, y2: number}>,
            boxes: CollisionBoxInfo[],
            collisionHandle: (obj1: string, obj2: string) => boolean) {
        const collisionResults = [] as Collision[];
        const skip = new Map<string, Set<string>>();
        for (const box of boxes) {
            skip.set(box.id, new Set<string>());
            const collisions = grid.test(box.bounds, (storedBox) => {
                const box2 = boxesByID[storedBox.id];
                if (box === undefined || box2 === undefined || box2.id === box.id) {
                    return undefined;
                }
                return CollisionDetector.testCollision(
                    box.bounds,
                    box2.bounds
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
                        if (box2 === undefined) {
                            continue;
                        }
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
                        else if (skip.get(box2.id) === undefined || !skip.get(box2.id)!.has(box.id)) {
                            const [box1Offsets, box2Offsets] = c.result.penetration.reduce((arr, offset) => {
                                arr[0].push({
                                    x: offset.x * 0.31,
                                    y: offset.y * 0.31,
                                    direction: offset.direction
                                });
                                arr[1].push({
                                    x: offset.x * -0.31,
                                    y: offset.y * -0.31,
                                    direction: DirectionFlipper.flip(offset.direction)!
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
                            const skips = skip.get(box.id);
                            if (skips !== undefined) {
                                skips.add(box2.id);
                            }
                        }
                    }
                }
            }
        }
        return collisionResults;
    }

// TODO: Use collision normal instead of "direction"

    private _findCollisionEvents(
            boxesByID: {[id: string]: CollisionBoxInfo | undefined},
            grid: QuadtreeGrid<{x1: number, y1: number, x2: number, y2: number, id: string}>,
            box: CollisionBoxInfo,
            box2: CollisionBoxInfo,
            offsets: Penetration[],
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
                if (box3 === undefined || [box.id, box2.id].concat(ignore).includes(box2.id)) {
                    return undefined;
                }
                return CollisionDetector.testCollision(
                    newBox,
                    box3.bounds
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
                            if (box3 === undefined || [box.id, c.box.id].concat(ignore).includes(box3.id)) {
                                return undefined;
                            }
                            return CollisionDetector.testCollision(
                                newNewBox,
                                box3.bounds
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
