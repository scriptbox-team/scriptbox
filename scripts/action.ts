import Component from "./component";

export default abstract class Action extends Component {
    public abstract execute: () => void;
}
