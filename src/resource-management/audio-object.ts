/**
 * The data for a single audio play to execute on the client.
 * @module resource-management
 */
export default class AudioObject {
    public static serialize(
            id: string,
            resource: string,
            volume: number,
            loop: boolean): AudioObject | undefined {
        if (
                typeof id === "string"
                && typeof(resource) === "string"
                && typeof(volume) === "number"
                && typeof(loop) === "boolean"
        ) {
            return new AudioObject(id, resource, volume, loop);
        }
        return undefined;
    }
    public id: string;
    public resource: string;
    public volume: number;
    public loop: boolean;
    constructor(id: string, resource: string, volume: number, loop: boolean) {
        this.id = id;
        this.resource = resource;
        this.volume = volume;
        this.loop = loop;
    }
}
