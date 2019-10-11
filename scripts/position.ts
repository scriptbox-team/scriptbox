import Aspect from "./aspect";
import Component from "./component";

export default class Position extends Component {
    public x: Aspect<number> = new Aspect(0);
    public y: Aspect<number> = new Aspect(0);

    public create(x?: number, y?: number) {
        if (typeof x === "number") {
            this.x.base = x;
        }
        if (typeof y === "number") {
            this.y.base = y;
        }
    }

    public move(xOffset: number, yOffset: number) {
        this.x.base += xOffset;
        this.y.base += yOffset;
    }

    public set(x: number, y: number) {
        this.x.base = x;
        this.y.base = y;
    }

    public setX(value: number) {
        this.x.base = value;
    }

    public setY(value: number) {
        this.y.base = value;
    }
}
