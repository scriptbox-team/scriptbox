export default class TokenGenerator {
    public static makeToken() {
        return Math.floor(Math.random() * 1000000000000);
    }
}
