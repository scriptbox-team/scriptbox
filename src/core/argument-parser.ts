export default class ArgumentParser {
    public static parse(args: string) {
        const match = args.match(/(?:[^\s\"\'\`]+|"[^"]+"|'[^']+'|`[^`]+`)+/g);
        return match !== null ? match : [];
    }
}
