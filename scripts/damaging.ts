import Aspect from "./aspect";
import AspectSet from "./aspect-set";
import Component from "./component";
import { EntityProxy } from "./entity";
import Hurtable from "./hurtable";
import Map from "./map";
import Set from "./set";

export default class Damaging extends Component {
    public hurtCooldown = new Aspect<number>(0.5);
    public damage = new Aspect<number>(20);
    public immunePlayers = new AspectSet<string>(["test"]);
    private _hurtCooldownTimers = new Map<string, number>();
    public onCreate(damage: number = 20, immunePlayers: string[] = []) {
        this.damage.base = damage;
        this.immunePlayers.base = new Set<string>(immunePlayers);
    }
    public onPostUpdate(delta: number) {
        const cooldownIterator = this._hurtCooldownTimers.entries();
        for (const [id, timer] of cooldownIterator) {
            const nextTime = timer - delta;
            if (nextTime <= 0) {
                this._hurtCooldownTimers.delete(id);
            }
            else {
                this._hurtCooldownTimers.set(id, nextTime);
            }
        }
    }
    public onCollision(other: EntityProxy, dense: boolean, direction?: "up" | "down" | "left" | "right") {
        if (!this.immunePlayers.getValue().has(other.id) && !this._hurtCooldownTimers.has(other.id)) {
            other.with<Hurtable>("hurtable", (h) => {
                h.hurt(this.damage.getValue());
                this._hurtCooldownTimers.set(other.id, this.hurtCooldown.getValue());
            });
        }
    }
}
