import Aspect from "./aspect";
import Component from "./component";

export default class CollisionBox extends Component {
    public x1: Aspect<number> = new Aspect(0);
    public y1: Aspect<number> = new Aspect(0);
    public x2: Aspect<number> = new Aspect(0);
    public y2: Aspect<number> = new Aspect(0);
    public static: Aspect<boolean> = new Aspect(false);
    public dense: Aspect<boolean> = new Aspect(true);

    public onCreate(x1?: number, y1?: number, x2?: number, y2?: number, isStatic?: boolean) {
        if (typeof x1 === "number") {
            this.x1.base = x1;
        }
        if (typeof y1 === "number") {
            this.y1.base = y1;
        }
        if (typeof x2 === "number") {
            this.x2.base = x2;
        }
        if (typeof y2 === "number") {
            this.y2.base = y2;
        }
        if (typeof isStatic === "boolean") {
            this.static.base = isStatic;
        }
    }

    public set(x1: number, y1: number, x2: number, y2: number) {
        this.x1.base = x1;
        this.y1.base = y1;
        this.x2.base = x2;
        this.y2.base = y2;
    }

    public getLeft() {
        return Math.min(this.x1.getValue(), this.x2.getValue());
    }

    public getRight() {
        return Math.max(this.x1.getValue(), this.x2.getValue());
    }

    public getTop() {
        return Math.min(this.y1.getValue(), this.y2.getValue());
    }

    public getBottom() {
        return Math.max(this.y1.getValue(), this.y2.getValue());
    }

    public getWidth() {
        return this.x2.getValue() > this.x1.getValue() ?
            this.x2.getValue() - this.x1.getValue() :
            this.x1.getValue() - this.x2.getValue();
    }

    public getHeight() {
        return this.x2.getValue() > this.x1.getValue() ?
            this.x2.getValue() - this.x1.getValue() :
            this.x1.getValue() - this.x2.getValue();
    }

    public getSize() {
        return {x: this.getWidth(), y: this.getHeight()};
    }
}
