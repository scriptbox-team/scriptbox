import Aspect from "./aspect";
import AspectArray from "./aspect-array";
import Control from "./control";
import Position from "./position";
import Velocity from "./velocity";

export default class DefaultControl extends Control {
    public commands: AspectArray<string> = new AspectArray<string>(["up", "down", "left", "right"]);
    public update() {
        super.update();
        this.entity.withMany<[Velocity, Position]>(["velocity", "position"], ([velocity, position]) => {
            const up = this.commandDown("up");
            const down = this.commandDown("down");
            const left = this.commandDown("left");
            const right = this.commandDown("right");

            if (up && down || !up && !down) {
                velocity.setY(0);
            }
            else if (up) {
                velocity.setY(-3);
            }
            else { // down
                velocity.setY(3);
            }

            if (left && right || !left && !right) {
                velocity.setX(0);
            }
            else if (left) {
                velocity.setX(-3);
            }
            else { // right
                velocity.setX(3);
            }
        });
    }
}
