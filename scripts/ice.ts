import Component from "./component";
import { EntityProxy } from "./entity";

export default class Ice extends Component {
    public onCollision(other: EntityProxy, dense: boolean, direction?: "up" | "down" | "left" | "right") {
        if (other.get("ice-slip") === undefined) {
            other.add("ice-slip", "ice-slip", this.owner);
        }
    }
}
