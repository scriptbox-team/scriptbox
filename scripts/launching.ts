import Aspect from "./aspect";
import AspectSet from "./aspect-set";
import Component from "./component";
import { EntityProxy } from "./entity";
import Velocity from "./velocity";

export default class Launching extends Component {
    public launchCooldown = new Aspect<number>(0.5);
    public launchPower = new Aspect<number>(200);
    public launchDirection = new Aspect<number>(-0.767945);
    public immunePlayers = new AspectSet<string>(["test"]);
    private _launchCooldownTimers = new Map<string, number>();
    public onCreate(launchPower: number = 200, launchDirection: number = -0.767945, immunePlayers: string[] = []) {
        this.launchPower.base = launchPower;
        this.launchDirection.base = launchDirection;
        this.immunePlayers.base = new Set<string>(immunePlayers);
    }
    public onPostUpdate(delta: number) {
        const cooldownIterator = this._launchCooldownTimers.entries();
        for (const [id, timer] of cooldownIterator) {
            const nextTime = timer - delta;
            if (nextTime <= 0) {
                this._launchCooldownTimers.delete(id);
            }
            else {
                this._launchCooldownTimers.set(id, nextTime);
            }
        }
    }
    public onCollision(other: EntityProxy, dense: boolean, direction?: "up" | "down" | "left" | "right") {
        if (!this.immunePlayers.getValue().has(other.id)
                && !this._launchCooldownTimers.has(other.id)
                && !other.get("collision-box").static.getValue()) {
            other.add(
                "launched",
                "launched" + Date.now(),
                this.owner,
                this.launchPower.getValue(),
                this.launchDirection.getValue()
            );
            this._launchCooldownTimers.set(other.id, this.launchCooldown.getValue());
        }
    }
}
