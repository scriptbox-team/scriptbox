import Aspect from "aspect";
import Component from "component";

export default class Position extends Component {
    public x = 0;
    public y = 0;

    public onCreate(x?: number, y?: number) {
        if (typeof x === "number") {
            this.x = x;
        }
        if (typeof y === "number") {
            this.y = y;
        }
    }

    public move(xOffset: number, yOffset: number) {
        this.x += xOffset;
        this.y += yOffset;
    }

    public set(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    public setX(value: number) {
        this.x = value;
    }

    public setY(value: number) {
        this.y = value;
    }
}
