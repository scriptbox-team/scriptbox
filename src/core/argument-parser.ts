/**
 * A static class which takes a string representing a list of string arguments, and separates it
 * into an array of strings. This will also handle spaces within these strings through the use
 * of surrounding quotations around the substring.
 *
 * @export
 * @class ArgumentParser
 * @module core
 */
export default class ArgumentParser {
    /**
     * Convert a string to a list of arguments
     *
     * @static
     * @param {string} args The string to convert.
     * @returns The arguments split into an array of strings.
     * @memberof ArgumentParser
     */
    public static parse(args: string) {
        // Some very C-style, imperative, gross code coming up
        // Figuring out a regex to accomplish this sufficiently seemed like more work than it was worth
        const quotes = ["\"", "\'", "\`"];
        const splitArgs: string[] = [];
        const length = args.length;
        let arg = "";
        let beginningQuote: string | undefined;
        let escaped = false;

        const tryToAddArg = (canBeEmpty: boolean = false) => {
            if (canBeEmpty || arg.length > 0) {
                splitArgs.push(arg);
                arg = "";
            }
        };

        for (let i = 0; i < length; i++) {
            const char = args.charAt(i);
            const isQuote = quotes.includes(char);
            if (beginningQuote === undefined && /\s/.test(char)) {
                tryToAddArg();
            }
            else if (!escaped && (char === beginningQuote || isQuote)) {
                if (beginningQuote === undefined) {
                    // Begin quote
                    tryToAddArg();
                    beginningQuote = char;
                }
                else {
                    // End quote
                    // Note: This deliberately pushes even if empty
                    // In case the user wants to put in an empty string as a parameter
                    tryToAddArg(true);
                    beginningQuote = undefined;
                }
            }
            else if (char === "\\") {
                if (escaped) {
                    arg += "\\";
                    escaped = false;
                }
                else {
                    escaped = true;
                }
            }
            else {
                if (escaped && !isQuote) {
                    arg += "\\";
                }
                escaped = false;
                arg += char;
            }
        }
        tryToAddArg();

        return splitArgs;
    }
}
