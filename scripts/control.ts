import Aspect from "./aspect";
import AspectSet from "./aspect-set";
import Component from "./component";

export default abstract class Control extends Component {
    public abstract commands: AspectSet<string>;
    public inputStates: {[key: string]: boolean} = {};
    public pastInputStates: {[key: string]: boolean} = {};
    public update() {
        // Put "simple" input mapping here
    }
    public postUpdate() {
        this.pastInputStates = Object.assign(this.inputStates, {});
    }
    public sendKeyPress(input: string) {
        const commands = this.commands.getValue();
        if (commands.has(input)) {
            this.inputStates[input] = true;
        }
    }
    public sendKeyRelease(input: string) {
        const commands = this.commands.getValue();
        if (commands.has(input)) {
            this.inputStates[input] = false;
        }
    }
    public commandPressed(command: string) {
        return this.inputStates[command] && !this.pastInputStates[command];
    }
    public commandReleased(command: string) {
        return !this.inputStates[command] && this.pastInputStates[command];
    }
    public commandDown(command: string) {
        return this.inputStates[command];
    }
    public commandUp(command: string) {
        return !this.inputStates[command];
    }
}
