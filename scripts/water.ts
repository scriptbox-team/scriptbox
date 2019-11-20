import Component from "component";
import { EntityProxy } from "entity";

export default class Water extends Component {
    public onCollision(other: EntityProxy, dense: boolean, direction?: "up" | "down" | "left" | "right") {
        if (other.get("swimming") === undefined) {
            other.add("swimming", "swimming", this.owner);
        }
    }
}
