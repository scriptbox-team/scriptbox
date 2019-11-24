interface BoundingBox {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
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

interface Penetration {
    x: number;
    y: number;
    direction?: "up" | "down" | "left" | "right";
}

export default class CollisionDetector {
    public static testCollision(
        box1: BoundingBox,
        box2: BoundingBox) {
        // Collision detection using minkowski difference
        // Adapted from https://blog.hamaluik.ca/posts/simple-aabb-collision-using-minkowski-difference/
        const diff = this._minkowskiDifference(box1, box2);
        if (diff.x1 < 0 && diff.y1 < 0 && diff.x2 > 0 && diff.y2 > 0) {
            return {
                penetration: this._getPenetrationVectors(diff, {x: 0, y: 0}).sort((a, b) => {
                    return (a.x * a.x + a.y * a.y) - (b.x * b.x + b.y * b.y);
                })
            };
        }
        return undefined;
    }
    private static _minkowskiDifference(box1: BoundingBox, box2: BoundingBox) {
        return {
            x1: box1.x1 - box2.x2,
            y1: box1.y1 - box2.y2,
            x2: box1.x2 - box2.x1,
            y2: box1.y2 - box2.y1,
        };
    }

    private static _getPenetrationVectors(box: BoundingBox, origin: Vector): Penetration[] {
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
            .filter((val) => val !== undefined) as Penetration[];
    }

    private static _getLines(box: BoundingBox) {
        return [
            {x: box.x1, y: box.y1, vec: {x: box.x2 - box.x1, y: 0}},
            {x: box.x2, y: box.y1, vec: {x: 0, y: box.y2 - box.y1}},
            {x: box.x2, y: box.y2, vec: {x: box.x1 - box.x2, y: 0}},
            {x: box.x1, y: box.y2, vec: {x: 0, y: box.y1 - box.y2}},
        ] as Line[];
    }

    private static _getNormal(line: Line) {
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

    private static _getLineIntersections(line1: Line, line2: Line) {
        const val = (line1.vec.y * line2.vec.x - line1.vec.x * line2.vec.y);
        if (val === 0) {
            return [undefined, undefined];
        }
        const t = ((line2.x - line1.x) * line2.vec.y + (line1.y - line2.y) * line2.vec.x) / -val;
        const u = ((line1.x - line2.x) * line1.vec.y + (line2.y - line1.y) * line1.vec.x) / val;
        return [t, u];
    }
}
