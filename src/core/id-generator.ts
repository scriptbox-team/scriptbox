// This ID is manually generated based on the MongoDB specifications
// https://docs.mongodb.com/manual/reference/bson-types/#objectid
// This is so this can be used scripting-side

/**
 * An ID generator which generates based on a variety of factors to have a unique ID.
 * This uses a modified version of the MongoDB ObjectID pattern.
 *
 * @export
 * @class IDGenerator
 * @module core
 */
export default class IDGenerator {
    private _counter: number;
    private _counterMax = 16777216;
    private _randomMax = 1099511627776;
    /**
     * Creates an instance of IDGenerator.
     * @param {number} counterSeed The seed to use for the counter for the ID generation algorithm.
     * @memberof IDGenerator
     */
    constructor(counterSeed: number) {
        this._counter = Math.floor(this._counterMax * counterSeed);
    }
    /**
     * Create an ID from the needed information for it.
     *
     * @param {string} prefix The prefix to use for the ID.
     * @param {number} time The time the ID was created.
     * @param {number} seed A random seed to use for the ID.
     * @returns {string} The new ID.
     * @memberof IDGenerator
     */
    public makeFrom(prefix: string, time: number, seed: number): string {
        const id =
            prefix +
            Math.floor(seed * this._randomMax).toString(16).padStart(10, "0")
            + this._counter.toString(16).padStart(6, "0")
            + Math.floor(time / 1000).toString(16).padStart(8, "0");
        this._counter = this._nextCounterValue(this._counter);
        return id;
    }
    /**
     * Create an ID from an existing hex string in the original MongoDB ObjectID format.
     *
     * @param {string} prefix The prefix to use for the ID.
     * @param {string} hexString The MongoDB ObjectID
     * @returns The converted ID.
     * @memberof IDGenerator
     */
    public makeFromHexString(prefix: string, hexString: string) {
        // Rearrange it so it's more obvious that IDs are different at a glance
        // In other words, put the timestamp part at the end, leaving the random value and counter before it
        return prefix + hexString.substr(8, 16) + hexString.substr(0, 8);
    }
    /**
     * Create a MongoDB ObjectID string from an ID created by this generator.
     *
     * @param {string} id The ID to create the MongoDB ObjectID from.
     * @returns The MongoDB ObjectID string.
     * @memberof IDGenerator
     */
    public makeHexStringFromID(id: string) {
        const len = id.length;
        return id.substr(len - 8, 8) + id.substr(len - 24, 16);
    }
    /**
     * Get the next value on the counter.
     * This will roll over if it exceeds the maximum value.
     *
     * @private
     * @param {number} current The current value of the counter.
     * @returns The next value of the counter.
     * @memberof IDGenerator
     */
    private _nextCounterValue(current: number) {
        return this._counter + 1 >= this._counterMax ? 0 : current + 1;
    }
}
