// This ID is manually generated based on the MongoDB specifications
// https://docs.mongodb.com/manual/reference/bson-types/#objectid
// This is so this can be used scripting-side

export default class IDGenerator {
    private counter: number;
    private counterMax = 16777216;
    private randomMax = 1099511627776;
    constructor(counterSeed: number) {
        this.counter = Math.floor(this.counterMax * counterSeed);
    }
    public makeFrom(time: number, seed: number): string {
        const id =
            Math.floor(seed * this.randomMax).toString(16).padStart(10, "0")
            + this.counter.toString(16).padStart(6, "0")
            + Math.floor(time / 1000).toString(16).padStart(8, "0");
        this.counter = this.nextCounterValue(this.counter);
        return id;
    }
    public makeFromHexString(hexString: string) {
        // Rearrange it so it's more obvious that IDs are different at a glance
        // In other words, put the timestamp part at the end, leaving the random value and counter before it
        return hexString.substr(8, 16) + hexString.substr(0, 8);
    }
    public makeHexStringFromID(id: string) {
        return id.substr(16, 8) + id.substr(0, 16);
    }
    private nextCounterValue(current: number) {
        return this.counter + 1 >= this.counterMax ? 0 : current + 1;
    }
}
