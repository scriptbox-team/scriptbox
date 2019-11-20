import Aspect from "aspect";
import AspectModifier from "aspect-modifier";
import Component from "component";
import { EntityProxy } from "entity";
import Position from "position";
import Velocity from "velocity";

export default class Gravity extends Component {
    public strength: Aspect<number> = new Aspect<number>(950);
    public cap: Aspect<number> = new Aspect<number>(500);
    public direction: Aspect<number> = new Aspect<number>(Math.PI * 0.5);
    private _xModifier?: AspectModifier<number>;
    private _yModifier?: AspectModifier<number>;
    private _xVelPortion: number = 0;
    private _yVelPortion: number = 0;
    private _currentSpeed: number = 0;
    public onLoad() {
        this.with<Velocity>("velocity", (velocity) => {
            this._xModifier = velocity.x.addModifier((v) => v + this._xVelPortion);
            this._yModifier = velocity.y.addModifier((v) => v + this._yVelPortion);
        });
    }
    public onUpdate(delta: number) {
        this.with<Position>("position", (position) => {
            position.x.base += this._xVelPortion * delta * delta;
            position.y.base += this._yVelPortion * delta * delta;
        });
    }
    public onPostUpdate(delta: number) {
        const dir = this.direction.getValue();

        const curVelocity: {x: number, y: number} = this.with<Velocity>("velocity",
            (velocity) => ({x: velocity.x.getValue(), y: velocity.y.getValue()}));
        const currentNetSpeed = curVelocity.x * Math.cos(dir) + curVelocity.y * Math.sin(dir);
        const speedCap = this.cap.getValue();
        const strength = this.strength.getValue();
        if (currentNetSpeed < speedCap) {
            if (currentNetSpeed + strength * delta > speedCap) {
                this._currentSpeed += speedCap - currentNetSpeed;
            }
            else {
                this._currentSpeed += strength * delta;
            }
        }
        this._xVelPortion = Math.cos(dir) * this._currentSpeed;
        this._yVelPortion = Math.sin(dir) * this._currentSpeed;
    }
    public onCollision(other: EntityProxy, dense: boolean, direction?: "up" | "down" | "left" | "right") {
        if (direction !== undefined) {
            let normalVec: [number, number];
            switch (direction) {
                case "up":
                    normalVec = [0, 1];
                    break;
                case "down":
                    normalVec = [0, -1];
                    break;
                case "left":
                    normalVec = [1, 0];
                    break;
                case "right":
                    normalVec = [-1, 0];
                    break;
            }
            const gravDir = this.direction.getValue();
            const dot = normalVec[0] * Math.cos(gravDir) + normalVec[1] * Math.sin(gravDir);
            if (dot < -0.5 || dot > 0.5) {
                this._currentSpeed = 0;
            }
        }
    }
    public onUnload() {
        this._xModifier.delete();
        this._yModifier.delete();
    }
}
