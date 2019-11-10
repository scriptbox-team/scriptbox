import Quadtree from "./quadtree";

interface BoundingBox {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}

export default class QuadtreeGrid<T extends BoundingBox> {
    private _cells: {[x: number]: {[y: number]: Quadtree<T>}};
    private _cellSize: number;
    private _treeDepth: number;
    constructor(elems: T[] = [], cellSize: number, treeDepth: number) {
        this._cells = {};
        this._cellSize = cellSize;
        this._treeDepth = treeDepth;
        for (const e of elems) {
            this.add(e);
        }
    }
    public add(elem: T) {
        const cellX1 = this._getCellCoordinate(elem.x1);
        const cellY1 = this._getCellCoordinate(elem.y1);
        const cellX2 = this._getCellCoordinate(elem.x2);
        const cellY2 = this._getCellCoordinate(elem.y2);
        for (let i = cellX1; i <= cellX2; i++) {
            if (this._cells[i] === undefined) {
                this._cells[i] = {};
            }
            for (let j = cellY1; j <= cellY2; j++) {
                if (this._cells[i][j] === undefined) {
                    this._cells[i][j] = new Quadtree<T>([elem], {
                        x1: i * this._cellSize,
                        y1: j * this._cellSize,
                        x2: (i + 1) * this._cellSize,
                        y2: (i + 1) * this._cellSize
                    }, this._treeDepth);
                }
                else {
                    this._cells[i][j].add(elem);
                }
            }
        }
    }
    public test<R>(box: BoundingBox, testFunc: (box2: T) => R | undefined) {
        const cellX1 = this._getCellCoordinate(box.x1);
        const cellY1 = this._getCellCoordinate(box.y1);
        const cellX2 = this._getCellCoordinate(box.x2);
        const cellY2 = this._getCellCoordinate(box.y2);
        const checkedSet = new Set<T>();
        let collisions = [] as Array<{box: T, result: R}>;
        for (let i = cellX1; i <= cellX2; i++) {
            if (this._cells[i] !== undefined) {
                for (let j = cellY1; j <= cellY2; j++) {
                    if (this._cells[i][j] !== undefined) {
                        const cell = this._cells[i][j];
                        collisions = collisions.concat(cell.test(box, (box2: T) => {
                            if (!checkedSet.has(box2)) {
                                checkedSet.add(box2);
                                return testFunc(box2);
                            }
                            return undefined;
                        }));
                    }
                }
            }
        }
        return collisions;
    }
    private _getCells(elem: T) {
        const cells: Array<Quadtree<T>> = [];
        const cellX1 = this._getCellCoordinate(elem.x1);
        const cellY1 = this._getCellCoordinate(elem.y1);
        const cellX2 = this._getCellCoordinate(elem.x2);
        const cellY2 = this._getCellCoordinate(elem.y2);
        for (let i = cellX1; i <= cellX2; i++) {
            for (let j = cellY1; j <= cellY2; j++) {
                if (this._cells[i] !== undefined && this._cells[i][j] !== undefined) {
                    cells.push(this._cells[i][j]);
                }
            }
        }
        return cells;
    }
    private _getCellCoordinate(coord: number) {
        return Math.floor(coord / this._cellSize);
    }
}
