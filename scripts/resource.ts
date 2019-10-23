export enum ResourceType {
    Script = "script",
    Image = "image",
    Sound = "sound",
    Prefab = "prefab",
    Unknown = "unknown"
}

export default class Resource {
    public static serialize(
        id: string,
        type: ResourceType,
        filename: string,
        name: string,
        creator: string,
        owner: string,
        description: string,
        time: number,
        icon: string,
    ) {
        if (
                typeof id === "string"
                && typeof type === "string"
                && typeof name === "string"
                && typeof filename === "string"
                && typeof creator === "string"
                && typeof owner === "string"
                && typeof description === "string"
                && typeof time === "number"
                && typeof icon === "string"
        ) {
            return new Resource(id, type, name, filename, creator, owner, description, time, icon);
        }
    }
    public id: string;
    public type: ResourceType;
    public name: string;
    public filename: string;
    public creator: string;
    public owner: string;
    public description: string;
    public time: number;
    public icon: string;
    constructor(
            id: string,
            type: ResourceType,
            name: string,
            filename: string,
            creator: string,
            owner: string,
            description: string,
            time: number,
            icon: string) {
        this.id = id;
        this.type = type;
        this.name = name;
        this.filename = filename;
        this.creator = creator;
        this.owner = owner;
        this.description = description;
        this.time = time;
        this.icon = icon;
    }
}
