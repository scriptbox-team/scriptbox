export default class PlayerSoul {
    public position: {
        x: number;
        y: number;
    };
    public velocity: {
        x: number;
        y: number;
    };
    public force: {
        x: number;
        y: number;
    };
    public bounds: {
        y: {
            max: number;
            min: number;
        }
        // no x bounds for now
    };
    public moveStrength: number = 13;
    public friction: number = 0.7;
    public color: number = 0xFFFFFF;
    private _inputs: {
        up: boolean,
        down: boolean,
        left: boolean,
        right: boolean
    };
    constructor(x: number, y: number) {
        this.position = {x, y};
        this.velocity = {x: 0, y: 0};
        this.force = {x: 0, y: 0};
        this.bounds = {
            y: {
                max: 8000,
                min: -1600
            }
        };
        this._inputs = {
            up: false,
            down: false,
            left: false,
            right: false
        };
    }
    public move(delta: number) {
        // Close enough physics
        const acceleration = {
            x: this.force.x - this.velocity.x * this.friction,
            y: this.force.y - this.velocity.y * this.friction
        };
        this.position.x += delta * this.velocity.x
            + 0.5 * delta * acceleration.x * acceleration.x;
        this.position.y += delta * this.velocity.y
            + 0.5 * delta * acceleration.y * acceleration.y;
        this.velocity.x += delta * acceleration.x;
        this.velocity.y += delta * acceleration.y;
        // Clamp the Y position to the y bounds
        this.position.y = Math.max(Math.min(this.position.y, this.bounds.y.max), this.bounds.y.min);
        // If we're close enough to 0 velocity when decelerating, then just make it 0
        if (Math.abs(this.velocity.x) < 0.2 && Math.sign(acceleration.x) !== Math.sign(this.velocity.x)) {
            this.velocity.x = 0;
        }
        if (Math.abs(this.velocity.y) < 0.2 && Math.sign(acceleration.y) !== Math.sign(this.velocity.y)) {
            this.velocity.y = 0;
        }
    }
    public keyInput(direction: "up" | "left" | "down" | "right", pressed: boolean) {
        this._inputs[direction] = pressed;
        this.handleKeyInput(this._inputs.up, this._inputs.left, this._inputs.down, this._inputs.right);
    }
    public handleKeyInput(up: boolean, left: boolean, down: boolean, right: boolean) {
        let xDir = 0;
        let yDir = 0;
        if (up && !down) {
            yDir = -1;
        }
        else if (down && !up) {
            yDir = 1;
        }
        if (left && !right) {
            xDir = -1;
        }
        else if (right && !left) {
            xDir = 1;
        }
        if (xDir !== 0 && yDir !== 0) {
            this.force = {
                x: xDir * this.moveStrength * Math.SQRT2,
                y: yDir * this.moveStrength * Math.SQRT2
            };
        }
        else {
            this.force = {
                x: xDir * this.moveStrength,
                y: yDir * this.moveStrength
            };
        }
    }
    public handleDirectionInput(direction: number, force: number) {
        this.force = {
            x: Math.cos(direction) * force * this.moveStrength,
            y: Math.sin(direction) * force * this.moveStrength
        };
    }
    public setPosition(x: number, y: number) {
        this.position.x = x;
        this.position.y = y;
    }
    public setVelocity(x: number, y: number) {
        this.velocity.x = x;
        this.velocity.y = y;
    }
}
