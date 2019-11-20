import Aspect from "./aspect";
import AspectModifier from "./aspect-modifier";
import Component from "./component";
import { EntityProxy } from "./entity";
import Gravity from "./gravity";
import PlayerControl from "./player-control";

export default class Swimming extends Component {
    public density: Aspect<number> = new Aspect(2);
    private _continue: boolean = true;
    private _frictionModifier?: AspectModifier<number>;
    private _forceModifier?: AspectModifier<number>;
    private _walkVelModifier?: AspectModifier<number>;
    private _jumpImpulseModifier?: AspectModifier<number>;
    private _dashImpulseModifier?: AspectModifier<number>;
    private _gravityModifier?: AspectModifier<number>;
    public onLoad() {
        const density = this.density.getValue();
        this.with<PlayerControl>("control", (pc) => {
            this._frictionModifier = pc.groundFriction.addModifier((n) => n / density ** 2);
            this._forceModifier = pc.groundMoveForce.addModifier((n) => n / density ** 2);
            this._walkVelModifier = pc.maxWalkVelocity.addModifier((n) => n / density);
            this._jumpImpulseModifier = pc.jumpImpulse.addModifier((n) => n / density);
            this._dashImpulseModifier = pc.dashImpulse.addModifier((n) => n / density);
        });
        this.with<Gravity>("gravity", (grav) => {
            this._gravityModifier = grav.strength.addModifier((n) => n / density ** 2);
        });
    }
    public onUnload() {
        if (this._frictionModifier) {
            this._frictionModifier.delete();
        }
        if (this._forceModifier) {
            this._forceModifier.delete();
        }
        if (this._walkVelModifier) {
            this._walkVelModifier.delete();
        }
        if (this._jumpImpulseModifier) {
            this._jumpImpulseModifier.delete();
        }
        if (this._dashImpulseModifier) {
            this._dashImpulseModifier.delete();
        }
        if (this._gravityModifier) {
            this._gravityModifier.delete();
        }
    }
    public onPostUpdate() {
        if (!this._continue) {
            this.destroy();
        }
        this._continue = false;
    }
    public onCollision(other: EntityProxy, dense: boolean, direction?: "up" | "down" | "left" | "right") {
        if (other.get("water") !== undefined) {
            this._continue = true;
        }
    }
}
