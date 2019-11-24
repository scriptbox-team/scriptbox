import Aspect from "aspect";
import Component from "component";
import { EntityProxy } from "entity";

export default class CollisionBox extends Component {
    public x1 = 0;
    public y1 = 0;
    public x2 = 0;
    public y2 = 0;
    public static = true;
    public dense = true;

    public onCreate(x1?: number, y1?: number, x2?: number, y2?: number, isStatic?: boolean, isDense?: boolean) {
        if (typeof x1 === "number") {
            this.x1 = x1;
        }
        if (typeof y1 === "number") {
            this.y1 = y1;
        }
        if (typeof x2 === "number") {
            this.x2 = x2;
        }
        if (typeof y2 === "number") {
            this.y2 = y2;
        }
        if (typeof isStatic === "boolean") {
            this.static = isStatic;
        }
        if (typeof isDense === "boolean") {
            this.dense = isDense;
        }
    }

    public set(x1: number, y1: number, x2: number, y2: number) {
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
    }

    public getLeft() {
        return Math.min(this.x1, this.x2);
    }

    public getRight() {
        return Math.max(this.x1, this.x2);
    }

    public getTop() {
        return Math.min(this.y1, this.y2);
    }

    public getBottom() {
        return Math.max(this.y1, this.y2);
    }

    public getWidth() {
        return this.x2 > this.x1 ?
            this.x2 - this.x1 :
            this.x1 - this.x2;
    }

    public getHeight() {
        return this.y2 > this.y1 ?
            this.y2 - this.y1 :
            this.y1 - this.y2;
    }

    public getSize() {
        return {x: this.getWidth(), y: this.getHeight()};
    }

    public canPush(entity: EntityProxy) {
        return this.dense;
    }
}
