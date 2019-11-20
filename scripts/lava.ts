import Component from "component";
import { EntityProxy } from "entity";

export default class Lava extends Component {
    public onCollision(other: EntityProxy, dense: boolean, direction?: "up" | "down" | "left" | "right") {
        if (other.get("burning") === undefined) {
            other.add("burning", "burning", this.owner);
        }
    }
}
