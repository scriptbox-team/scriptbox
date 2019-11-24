import Aspect from "aspect";
import AspectSet from "aspect-set";
import Component from "component";

export default abstract class Control extends Component {
    public abstract commands: AspectSet<string>;
    public inputStates: {[key: string]: boolean} = {};
    public pastInputStates: {[key: string]: boolean} = {};
    public canControl: Aspect<boolean> = new Aspect<boolean>(true);
    public onUpdate(delta: number) {
        super.onUpdate(delta);
        // If we can't control it, all inputs should be dropped
        if (!this.canControl.getValue()) {
            const keys = Object.keys(this.inputStates);
            for (const key of keys) {
                this.inputStates[key] = false;
            }
        }
    }
    public onPostUpdate(delta: number) {
        this.pastInputStates = Object.assign({}, this.inputStates);
    }
    public sendKeyPress(input: string) {
        if (this.canControl.getValue()) {
            const commands = this.commands.getValue();
            if (commands.has(input)) {
                this.inputStates[input] = true;
            }
        }
    }
    public sendKeyRelease(input: string) {
        if (this.canControl.getValue()) {
            const commands = this.commands.getValue();
            if (commands.has(input)) {
                this.inputStates[input] = false;
            }
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
