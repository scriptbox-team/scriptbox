import Aspect from "./aspect";
import AspectModifier from "./aspect-modifier";
import AspectSet from "./aspect-set";
import Control from "./control";
import Position from "./position";
import Velocity from "./velocity";

export default class DefaultControl extends Control {
    public commands: AspectSet<string>
        = new AspectSet(["up", "down", "left", "right"]);
    public moveSpeed: Aspect<number> = new Aspect<number>(180);
    private _xMoveVelocity = 0;
    private _yMoveVelocity = 0;
    public create() {
        this.entity.with<Velocity>("velocity", (velocity) => {
            velocity.x.addModifier((v) => v + this._xMoveVelocity);
            velocity.y.addModifier((v) => v + this._yMoveVelocity);
        });
    }
    public update(delta: number) {
        super.update(delta);
        this.entity.withMany<[Velocity, Position]>(["velocity", "position"], ([velocity, position]) => {
            const up = this.commandDown("up");
            const down = this.commandDown("down");
            const left = this.commandDown("left");
            const right = this.commandDown("right");

            if (up && down || !up && !down) {
                this._yMoveVelocity = 0;
            }
            else if (up) {
                this._yMoveVelocity = -this.moveSpeed.getValue();
            }
            else { // down
                this._yMoveVelocity = this.moveSpeed.getValue();
            }

            if (left && right || !left && !right) {
                this._xMoveVelocity = 0;
            }
            else if (left) {
                this._xMoveVelocity = -this.moveSpeed.getValue();
            }
            else { // right
                this._xMoveVelocity = this.moveSpeed.getValue();
            }
        });
    }
}
