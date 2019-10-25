import Aspect from "./aspect";
import Component from "./component";
import Position from "./position";

export default class Velocity extends Component {
    public x: Aspect<number> = new Aspect(0);
    public y: Aspect<number> = new Aspect(0);

    public create(x?: number, y?: number) {
        this.x.base = 0;
        if (typeof x === "number") {
            this.x.base = x;
        }

        this.y.base = 0;
        if (typeof y === "number") {
            this.y.base = y;
        }
    }

    public update() {
        this.entity.with<Position>("position", (position) => {
            position.move(this.x.getValue(), this.y.getValue());
        });
    }

    public move(xOffset: number, yOffset: number) {
        this.x.base += xOffset;
        this.y.base += yOffset;
    }

    public setX(value: number) {
        this.x.base = value;
    }

    public setY(value: number) {
        this.y.base = value;
    }
}
