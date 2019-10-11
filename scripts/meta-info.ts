export default class MetaInfo {
    public name: string;
    public description: string;
    public owner: string;
    public enabled: boolean;
    public exists: boolean;
    private _tags: Set<string>;
    constructor(name: string, description: string, owner: string, enabled: boolean, exists: boolean, tags: string[]) {
        this.name = name;
        this.description = description;
        this.owner = owner;
        this.enabled = enabled;
        this.exists = exists;
        this._tags = new Set<string>(tags);
    }
    public addTag(tag: string) {
        this._tags.add(tag);
    }
    public removeTag(tag: string) {
        this._tags.delete(tag);
    }
    public hasTag(tag: string) {
        return this._tags.has(tag);
    }
}
