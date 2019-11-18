import Aspect from "./aspect";
import AspectModifier from "./aspect-modifier";
import AspectSet from "./aspect-set";
import BasicAttack from "./basic-attack";
import Control from "./control";
import { EntityProxy } from "./entity";
import Position from "./position";
import Velocity from "./velocity";

export default class PlayerControl extends Control {
    public commands: AspectSet<string>
        = new AspectSet(["up", "down", "left", "right", "action1"]);
    public groundMoveForce: Aspect<number> = new Aspect<number>(1600);
    public airMoveForce: Aspect<number> = new Aspect<number>(1500);
    public jumpImpulse: Aspect<number> = new Aspect<number>(450);
    public maxWalkVelocity: Aspect<number> = new Aspect<number>(350);
    public groundFriction: Aspect<number> = new Aspect<number>(1600);
    public airFriction: Aspect<number> = new Aspect<number>(1000);
    public facing: Aspect<number> = new Aspect<number>(1);
    public dashImpulse: Aspect<number> = new Aspect<number>(700);
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
        const left = this.commandDown("left");
        const right = this.commandDown("right");
        const up = this.commandPressed("up");
        const down = this.commandPressed("down");
        const attack = this.commandPressed("action1");

        if (up) {
            this.with<Velocity>("velocity", (velocity) => {
                velocity.y.base = -this.jumpImpulse.getValue();
            });
        }

        const friction = this.groundFriction.getValue() * delta;
        const moveForce = this.groundMoveForce.getValue() * delta;
        const maxWalkVelocity = this.maxWalkVelocity.getValue();

        if (left && right || !left && !right) {
            if (this._xMoveVelocity !== 0) {
                if (this._xMoveVelocity > 0) {
                    this._xMoveVelocity = this._xMoveVelocity - friction < 0 ? 0 : this._xMoveVelocity - friction;
                }
                else {
                    this._xMoveVelocity = this._xMoveVelocity + friction > 0 ? 0 : this._xMoveVelocity + friction;
                }
            }
        }
        else if (left) {
            if (this._xMoveVelocity !== -maxWalkVelocity) {
                if (this._xMoveVelocity > -maxWalkVelocity) {
                    this._xMoveVelocity = this._xMoveVelocity - moveForce < -maxWalkVelocity
                         ? -maxWalkVelocity : this._xMoveVelocity - moveForce;
                }
                else {
                    this._xMoveVelocity = this._xMoveVelocity + friction > -maxWalkVelocity
                        ? -maxWalkVelocity : this._xMoveVelocity + friction;
                }
            }
            this.facing.base = -1;
        }
        else { // right
            if (this._xMoveVelocity !== maxWalkVelocity) {
                if (this._xMoveVelocity < maxWalkVelocity) {
                    this._xMoveVelocity = this._xMoveVelocity + moveForce > maxWalkVelocity
                         ? maxWalkVelocity : this._xMoveVelocity + moveForce;
                }
                else {
                    this._xMoveVelocity = this._xMoveVelocity - friction < maxWalkVelocity
                        ? maxWalkVelocity : this._xMoveVelocity - friction;
                }
            }
            this.facing.base = 1;
        }

        if (down) {
            this._xMoveVelocity = this.dashImpulse.getValue() * this.facing.getValue();
        }

        if (attack) {
            this.with<BasicAttack>("basic-attack", (basicAttack) => {
                basicAttack.execute();
            });
        }
    }
    public onCollision(other: EntityProxy, dense: boolean, direction?: "up" | "down" | "left" | "right") {
        this.with<Velocity>("velocity", (v) => {
            const xVel = v.x.getValue();
            switch (direction) {
                case "left":
                    if (xVel < 0) {
                        this._xMoveVelocity = 0;
                    }
                    break;
                case "right":
                    if (xVel > 0) {
                        this._xMoveVelocity = 0;
                    }
                    break;
            }
        });
    }
    public onUnload() {
        if (this._xModifier) {
            this._xModifier.delete();
        }
        if (this._yModifier) {
            this._yModifier.delete();
        }
    }
}
