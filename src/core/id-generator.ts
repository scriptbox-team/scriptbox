import { ObjectID } from "mongodb";

export default class IDGenerator {
    public static generate(): string {
        // Start with https://docs.mongodb.com/manual/reference/bson-types/#objectid
        // const hexString = ObjectID.createFromTime(time).toHexString();
        const hexString = new ObjectID().toHexString();
        return this.makeFromHexString(hexString);
    }
    public static makeFromHexString(hexString: string) {
        // Rearrange it so it's more obvious that IDs are different at a glance
        // In other words, put the timestamp part at the end, leaving the random value and counter before it
        return hexString.substr(8, 16) + hexString.substr(0, 8);
    }
    public static makeHexStringFromID(id: string) {
        return id.substr(16, 8) + id.substr(0, 16);
    }
}
