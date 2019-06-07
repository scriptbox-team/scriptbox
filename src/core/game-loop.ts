import hrtime from "browser-process-hrtime";

/**
 * A basic loop which performs an action repeatedly.
 * It repeats based on a frequency, and skips frames if necessary.
 *
 * @export
 * @class GameLoop
 */
export default class GameLoop {
    private funcToLoop: (delta: number) => void;
    private tickDelay: number;
    private skipThreshhold: number;

    private running: boolean;

    private lastTickTime: number;
    private nextTickTime: number;
    private hrTimeDiff: [number, number];

    /**
     * Creates an instance of GameLoop.
     * This does not start the loop.
     * @param {(delta: number) => void} funcToLoop The function to loop.
     * @param {number} tickRate How many times per second to execute the function.
     * @memberof GameLoop
     */
    constructor(funcToLoop: (delta: number) => void, tickRate: number) {
        this.funcToLoop = funcToLoop;
        this.tickDelay = 1 / tickRate;
        this.skipThreshhold = 1; // 1 second

        this.running = false;

        this.lastTickTime = 0;
        this.nextTickTime = this.tickDelay;
        this.hrTimeDiff = hrtime();

        this.tick = this.tick.bind(this);
    }

    /**
     * Start the loop.
     *
     * @memberof GameLoop
     */
    public start() {
        this.running = true;
        this.hrTimeDiff = hrtime();
        setTimeout(this.tick, this.tickDelay * 1000, this.tickDelay);
    }

    /**
     * Stop the loop.
     *
     * @memberof GameLoop
     */
    public stop() {
        this.running = false;
    }

    /**
     * A single tick of the loop.
     * This will perform the action and set up the next tick to perform.
     *
     * @private
     * @memberof GameLoop
     */
    private tick() {
        if (this.running) {
            this.nextTickDo(this.tick);
            this.funcToLoop(this.tickDelay);
        }
    }

    /**
     * Perform an action one tick from now.
     * This will skip a frame if the loop has fallen too far behind.
     *
     * @private
     * @param {() => void} func The functoin to perform in a tick.
     * @memberof GameLoop
     */
    private nextTickDo(func: () => void) {
        const tickDiff = this.getTickTime();
        this.lastTickTime += tickDiff;
        this.nextTickTime += this.tickDelay;

        let timeToWait = this.nextTickTime - this.lastTickTime;

        // If we're too far behind, just set it to a tick from now
        if (timeToWait < -this.skipThreshhold) {
            this.nextTickTime = this.lastTickTime + this.tickDelay;
            timeToWait = this.tickDelay;
        }

        setTimeout(func, timeToWait * 1000);
        this.hrTimeDiff = hrtime();
    }

    /**
     * Get the time of the current tick.
     *
     * @private
     * @returns The time of the current tick.
     * @memberof GameLoop
     */
    private getTickTime() {
        const tickDiffSeparate: [number, number] = hrtime(this.hrTimeDiff);
        return tickDiffSeparate[0] + tickDiffSeparate[1] / 1000000000;
    }
}
