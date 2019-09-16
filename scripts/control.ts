import Aspect from "./aspect";
import AspectArray from "./aspect-array";
import Module from "./module";

export default abstract class Control extends Module {
    public abstract commands: AspectArray<string>;
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
        if (commands.includes(input)) {
            this.inputStates[input] = true;
        }
    }
    public sendKeyRelease(input: string) {
        const commands = this.commands.getValue();
        if (commands.includes(input)) {
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
