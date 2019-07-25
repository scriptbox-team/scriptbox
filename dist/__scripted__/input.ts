export default class Input {
    public command: string;
    public pressed: boolean;
    constructor(command: string, pressed: boolean) {
        this.command = command;
        this.pressed = pressed;
    }
}
