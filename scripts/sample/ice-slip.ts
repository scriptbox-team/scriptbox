import AspectModifier from "../aspect-modifier";
import Component from "../component";
import { EntityProxy } from "../entity";
import PlayerControl from "../player-control";

export default class IceSlip extends Component {
    private _continue: boolean = true;
    private _frictionModifier?: AspectModifier<number>;
    private _forceModifier?: AspectModifier<number>;
    public onLoad() {
        this.with<PlayerControl>("control", (pc) => {
            this._frictionModifier = pc.groundFriction.addModifier((n) => 160);
            this._forceModifier = pc.groundMoveForce.addModifier((n) => 230);
        });
    }
    public onUnload() {
        if (this._frictionModifier) {
            this._frictionModifier.delete();
        }
        if (this._forceModifier) {
            this._forceModifier.delete();
        }
    }
    public onPostUpdate() {
        if (!this._continue) {
            this.destroy();
        }
        this._continue = false;
    }
    public onCollision(other: EntityProxy, dense: boolean, direction?: "up" | "down" | "left" | "right") {
        if (other.get("ice") !== undefined) {
            this._continue = true;
        }
    }
}
