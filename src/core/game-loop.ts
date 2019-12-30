import hrtime from "browser-process-hrtime";

/**
 * A basic loop which performs an action repeatedly.
 * It repeats based on a frequency, and skips frames if necessary.
 *
 * @export
 * @class GameLoop
 * @module core
 */
export default class GameLoop {
    private _funcToLoop: (delta: number) => void;
    private _tickDelay: number;
    private _skipThreshhold: number;

    private _running: boolean;

    private _lastTickTime: number;
    private _nextTickTime: number;
    private _hrTimeDiff: [number, number];

    /**
     * Creates an instance of GameLoop.
     * This does not start the loop.
     * @param {(delta: number) => void} funcToLoop The function to loop.
     * @param {number} tickRate How many times per second to execute the function.
     * @memberof GameLoop
     */
    constructor(funcToLoop: (delta: number) => void, tickRate: number) {
        this._funcToLoop = funcToLoop;
        this._tickDelay = 1 / tickRate;
        this._skipThreshhold = 1; // 1 second

        this._running = false;

        this._lastTickTime = 0;
        this._nextTickTime = this._tickDelay;
        this._hrTimeDiff = hrtime();

        this._tick = this._tick.bind(this);
    }

    /**
     * Start the loop.
     *
     * @memberof GameLoop
     */
    public start() {
        this._running = true;
        this._hrTimeDiff = hrtime();
        setTimeout(this._tick, this._tickDelay * 1000, this._tickDelay);
    }

    /**
     * Stop the loop.
     *
     * @memberof GameLoop
     */
    public stop() {
        this._running = false;
    }

    /**
     * A single tick of the loop.
     * This will perform the action and set up the next tick to perform.
     *
     * @private
     * @memberof GameLoop
     */
    private _tick() {
        if (this._running) {
            this._nextTickDo(this._tick);
            this._funcToLoop(this._tickDelay);
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
    private _nextTickDo(func: () => void) {
        const tickDiff = this._getTickTime();
        this._lastTickTime += tickDiff;
        this._nextTickTime += this._tickDelay;

        let timeToWait = this._nextTickTime - this._lastTickTime;

        // If we're too far behind, just set it to a tick from now
        if (timeToWait < -this._skipThreshhold) {
            this._nextTickTime = this._lastTickTime + this._tickDelay;
            timeToWait = this._tickDelay;
        }

        setTimeout(func, timeToWait * 1000);
        this._hrTimeDiff = hrtime();
    }

    /**
     * Get the time of the current tick.
     *
     * @private
     * @returns The time of the current tick.
     * @memberof GameLoop
     */
    private _getTickTime() {
        const tickDiffSeparate: [number, number] = hrtime(this._hrTimeDiff);
        return tickDiffSeparate[0] + tickDiffSeparate[1] / 1000000000;
    }
}
