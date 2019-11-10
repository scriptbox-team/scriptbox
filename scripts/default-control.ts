import Aspect from "./aspect";
import AspectModifier from "./aspect-modifier";
import AspectSet from "./aspect-set";
import Control from "./control";
import Position from "./position";
import Velocity from "./velocity";

export default class DefaultControl extends Control {
    public commands: AspectSet<string>
        = new AspectSet(["up", "down", "left", "right"]);
    public moveSpeed: Aspect<number> = new Aspect<number>(500);
    private _xMoveVelocity = 0;
    private _yMoveVelocity = 0;
    private _xModifier?: AspectModifier<number>;
    private _yModifier?: AspectModifier<number>;
    public onLoad() {
        this.with<Velocity>("velocity", (velocity) => {
            this._xModifier = velocity.x.addModifier((v) => v + this._xMoveVelocity);
            this._yModifier = velocity.y.addModifier((v) => v + this._yMoveVelocity);
        });
    }
    public onUpdate(delta: number) {
        super.onUpdate(delta);
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
    }
    public onUnload() {
        this._xModifier.delete();
        this._yModifier.delete();
    }
}
