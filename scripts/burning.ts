import Aspect from "./aspect";
import Chat from "./chat";
import Component from "./component";
import { EntityProxy } from "./entity";
import Hurtable from "./hurtable";

export default class Burning extends Component {
    public damage: Aspect<number> = new Aspect(20);
    public tickTime: Aspect<number> = new Aspect(1);
    private _timer: number = 0;
    private _continue: boolean = true;
    public onCreate() {
        this.with<Hurtable>("hurtable", (hurtable) => {
            hurtable.hurt(this.damage.getValue());
        });
        this._timer = this.tickTime.getValue();
    }
    public onPostUpdate(delta: number) {
        this._timer -= delta;
        if (this._timer <= 0) {
            if (!this._continue) {
                this.destroy();
            }
            else {
                this.with<Hurtable>("hurtable", (hurtable) => {
                    hurtable.hurt(this.damage.getValue());
                });
                this._timer = this.tickTime.getValue();
            }
        }
        this._continue = false;
    }
    public onCollision(other: EntityProxy, dense: boolean, direction?: "up" | "down" | "left" | "right") {
        if (other.get("lava") !== undefined) {
            this._continue = true;
        }
    }
}
