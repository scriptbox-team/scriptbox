import Aspect from "aspect";
import AspectModifier from "aspect-modifier";
import Component from "component";
import { EntityProxy } from "entity";
import Velocity from "velocity";

export default class Launched extends Component {
    public launchDeterioration: Aspect<number> = new Aspect<number>(550);
    private _launchXVel: number = 0;
    private _launchYVel: number = 0;
    private _velXModifier?: AspectModifier<number>;
    private _velYModifier?: AspectModifier<number>;
    public onCreate(launchPower: number = 0, launchDirection: number = 0) {
        this._launchXVel = Math.cos(launchDirection) * launchPower;
        this._launchYVel = Math.sin(launchDirection) * launchPower;
    }
    public onLoad() {
        this.with<Velocity>("velocity", (v) => {
            this._velXModifier = v.x.addModifier((num) => num + this._launchXVel);
            this._velYModifier = v.y.addModifier((num) => num + this._launchYVel);
        });
    }
    public onPostUpdate(delta: number) {
        const velLen = Math.sqrt(this._launchXVel ** 2 + this._launchYVel ** 2);
        if (velLen === 0) {
            this.destroy();
            return;
        }
        const deterioration = this.launchDeterioration.getValue() * delta;
        const vec = {x: -this._launchXVel / velLen * deterioration, y: -this._launchYVel / velLen * deterioration};
        const nextVelX = this._launchXVel + vec.x;
        const nextVelY = this._launchYVel + vec.y;
        // Check if the next velocity and the deterioration have the same sign
        // If so we should stop at 0 instead
        this._launchXVel = nextVelX * vec.x > 0 ? 0 : nextVelX;
        this._launchYVel = nextVelY * vec.y > 0 ? 0 : nextVelY;
        if (this._launchXVel === 0 && this._launchYVel === 0) {
            this.destroy();
        }
    }
    public onUnload() {
        if (this._velXModifier !== undefined) {
            this._velXModifier.delete();
        }
        if (this._velYModifier !== undefined) {
            this._velYModifier.delete();
        }
    }
    public onCollision(other: EntityProxy, dense: boolean, direction?: "up" | "down" | "left" | "right") {
        let xVel = 0;
        let yVel = 0;
        this.with<Velocity>("velocity", (v) => {
            xVel = v.x.getValue();
            yVel = v.y.getValue();
        });
        switch (direction) {
            case "up":
                if (yVel < 0) {
                    this._launchYVel = 0;
                }
                break;
            case "down":
                if (yVel > 0) {
                    this._launchYVel = 0;
                }
                break;
            case "left":
                if (xVel < 0) {
                    this._launchXVel = 0;
                }
                break;
            case "right":
                if (xVel > 0) {
                    this._launchXVel = 0;
                }
                break;
        }
    }
}
