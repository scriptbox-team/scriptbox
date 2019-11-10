interface BoundingBox {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}

interface TreeNode<T extends BoundingBox> {
    data: T[];
    bounds: BoundingBox;
    branches: {
        topLeft?: TreeNode<T>;
        topRight?: TreeNode<T>;
        bottomLeft?: TreeNode<T>;
        bottomRight?: TreeNode<T>;
    };
}

export default class Quadtree<T extends BoundingBox> {
    private _root: TreeNode<T>;
    private _depth: number;

    constructor(elems: T[] = [], bounds: BoundingBox, depth: number) {
        this._root = this._makeEmptyNode(bounds);
        this._depth = depth;
        for (const e of elems) {
            this.add(e);
        }
    }

    public add(elem: T) {
        this._addTo(this._root, elem, 1);
    }

    public test<R>(box: BoundingBox, testFunc: (box2: T) => R | undefined) {
        return this._testNode(this._root, box, testFunc);
    }

    private _addTo(node: TreeNode<T>, elem: T, currentDepth: number) {
        if (currentDepth >= this._depth) {
            node.data.push(elem);
        }
        else {
            const {left, above, right, below, midX, midY} = this._calcQuadrant(node, elem);
            if (!left && !right || !below && !above) {
                // This bounding box is on a border
                // Put it in the parent
                node.data.push(elem);
                return;
            }
            if (left && above) {
                const bounds = {
                    x1: node.bounds.x1,
                    y1: node.bounds.y1,
                    x2: midX,
                    y2: midY
                };
                this._addToParent(node, "topLeft", bounds, elem, currentDepth);
            }
            else if (right && above) {
                const bounds = {
                    x1: midX,
                    y1: node.bounds.y1,
                    x2: node.bounds.x2,
                    y2: midY
                };
                this._addToParent(node, "topRight", bounds, elem, currentDepth);
            }
            else if (left && below) {
                const bounds = {
                    x1: node.bounds.x1,
                    y1: midY,
                    x2: midX,
                    y2: node.bounds.y2
                };
                this._addToParent(node, "bottomLeft", bounds, elem, currentDepth);
            }
            else { // right && below
                const bounds = {
                    x1: midX,
                    y1: midY,
                    x2: node.bounds.x2,
                    y2: node.bounds.y2
                };
                this._addToParent(node, "bottomRight", bounds, elem, currentDepth);
            }
        }
    }

    private _testNode<R>(
            node: TreeNode<T> | undefined,
            box: BoundingBox,
            testFunc: (box2: T) => R | undefined): Array<{box: T, result: R}> {
        if (node === undefined) {
            return [];
        }
        // If we're at the end of a branch we need to leaf right away
        const {left, above, right, below} = this._calcQuadrant(node, box);
        if (!left && !right || !below && !above) {
            const boxes = this._getChildNodeContents(node);
            return boxes.reduce((acc, box2) => {
                const res = testFunc(box2);
                if (res !== undefined) {
                    acc.push({box: box2, result: res});
                }
                return acc;
            }, [] as Array<{box: T, result: R}>);
        }
        // Otherwise take everything from the current node and go to the next branch down
        const currentNodeChecks = node.data.reduce((acc, box2) => {
            const res = testFunc(box2);
            if (res !== undefined) {
                acc.push({box: box2, result: res});
            }
            return acc;
        }, [] as Array<{box: T, result: R}>);
        if (left && above) {
            return this._testNode(node.branches.topLeft, box, testFunc).concat(currentNodeChecks);
        }
        else if (right && above) {
            return this._testNode(node.branches.topRight, box, testFunc).concat(currentNodeChecks);
        }
        else if (left && below) {
            return this._testNode(node.branches.bottomLeft, box, testFunc).concat(currentNodeChecks);
        }
        else { // right && below
            return this._testNode(node.branches.bottomRight, box, testFunc).concat(currentNodeChecks);
        }
    }

    private _getChildNodeContents(node: TreeNode<T> | undefined): T[] {
        if (node === undefined) {
            return [];
        }
        return [
            ...this._getChildNodeContents(node.branches.topLeft),
            ...this._getChildNodeContents(node.branches.topRight),
            ...this._getChildNodeContents(node.branches.bottomLeft),
            ...this._getChildNodeContents(node.branches.bottomRight),
            ...node.data
        ];
    }

    private _addToParent(
            parent: TreeNode<T>,
            branch: "topLeft" | "bottomLeft" | "topRight" | "bottomRight",
            bounds: BoundingBox,
            elem: T,
            currentDepth: number) {
        if (parent.branches[branch] === undefined) {
            parent.branches[branch] = this._makeEmptyNode(bounds);
        }
        this._addTo(parent.branches[branch], elem, currentDepth + 1);
    }

    private _makeEmptyNode(bounds: BoundingBox) {
        return {
            data: [],
            bounds,
            branches: {}
        };
    }

    private _calcQuadrant(node: TreeNode<T>, box: BoundingBox) {
        const midX = (node.bounds.x1 + node.bounds.x2) / 2;
        const midY = (node.bounds.y1 + node.bounds.y2) / 2;
        const left = box.x2 < midX;
        const above = box.y2 < midY;
        const right = box.x1 >= midX;
        const below = box.y1 >= midY;
        return {left, above, right, below, midX, midY};
    }
}
