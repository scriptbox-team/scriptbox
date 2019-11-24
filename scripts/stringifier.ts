export default class Stringifier {
    public static stringify(obj: any, space?: string | number) {
        if (typeof obj === "object") {
            return this._stringifyObject(obj, space);
        }
        return JSON.stringify(obj, null, space);
    }
    private static _stringifyObject(obj: object, space?: string | number): string {
        const set = new WeakSet();
        return JSON.stringify(obj, (key, val) => {
            if (set.has(val)) {
                return "[Circular]";
            }
            if (typeof val === "object") {
                set.add(val);
            }
            return val;
        }, space);
    }
}
