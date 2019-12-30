/**
 * A dead-simple static token generation class, for use with network functionalities.
 * @module networking
 */
export default class TokenGenerator {
    public static makeToken() {
        return Math.floor(Math.random() * 1000000000000);
    }
}
