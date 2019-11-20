import Aspect from "aspect";
import Component from "component";
import { EntityProxy } from "entity";
import Position from "position";

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

    public onCollision(other: EntityProxy, dense: boolean, direction?: "up" | "down" | "left" | "right") {
        const xVel = this.x.getValue();
        const yVel = this.y.getValue();
        switch (direction) {
            case "up":
                if (yVel < 0) {
                    this.y.base = 0;
                }
                break;
            case "down":
                if (yVel > 0) {
                    this.y.base = 0;
                }
                break;
            case "left":
                if (xVel < 0) {
                    this.x.base = 0;
                }
                break;
            case "right":
                if (xVel > 0) {
                    this.x.base = 0;
                }
                break;
        }
    }

    public move(xOffset: number, yOffset: number) {
        this.x.base += xOffset;
        this.y.base += yOffset;
    }
}
