export default class ResourceGetter {
    public static externalGet: (username: string, filename: string) => string | undefined;
    public static get(username: string, filename: string) {
        this.externalGet(username, filename);
    }
}
