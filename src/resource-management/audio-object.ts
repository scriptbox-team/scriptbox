export default class AudioObject {
    public static serialize(
            resource: string,
            volume: number,
            loop: boolean,
            music: boolean): AudioObject | undefined {
        if (
                typeof(resource) === "string"
                && typeof(volume) === "number"
                && typeof(loop) === "boolean"
                && typeof(music) === "boolean"
        ) {
            return new AudioObject(resource, volume, loop, music);
        }
        return undefined;
    }
    public resource: string;
    public volume: number;
    public loop: boolean;
    public music: boolean;
    constructor(resource: string, volume: number, loop: boolean, music: boolean) {
        this.resource = resource;
        this.volume = volume;
        this.loop = loop;
        this.music = music;
    }
}
