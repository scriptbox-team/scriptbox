import Aspect from "./aspect";
import Component from "./component";
import Position from "./position";

export default class Velocity extends Component {
    public x: Aspect<number> = new Aspect(0);
    public y: Aspect<number> = new Aspect(0);

    public onCreate(x?: number, y?: number) {
        this.x.base = 0;
        if (typeof x === "number") {
            this.x.base = x;
        }

        this.y.base = 0;
        if (typeof y === "number") {
            this.y.base = y;
        }
    }

    public onUpdate(delta: number) {
        this.with<Position>("position", (position) => {
            position.move(this.x.getValue() * delta, this.y.getValue() * delta);
        });
    }

    public move(xOffset: number, yOffset: number) {
        this.x.base += xOffset;
        this.y.base += yOffset;
    }
}
