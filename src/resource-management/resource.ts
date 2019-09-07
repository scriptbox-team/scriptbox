import ResourceOption from "./resource-option";

export enum ResourceType {
    Script = "script",
    Component = "component",
    Image = "image",
    Sound = "sound",
    Prefab = "prefab",
    Unknown = "unknown"
}

export default class Resource {
    public static serialize(
        id: string,
        type: ResourceType,
        name: string,
        creator: string,
        description: string,
        time: number,
        icon: string,
        options: ResourceOption[]
    ) {
        if (
                typeof id === "string"
                && typeof type === "string"
                && typeof name === "string"
                && typeof creator === "string"
                && typeof description === "string"
                && typeof time === "number"
                && typeof icon === "string"
                && Array.isArray(options)
        ) {
            return new Resource(id, type, name, creator, description, time, icon, options);
        }
    }
    public id: string;
    public type: ResourceType;
    public name: string;
    public creator: string;
    public description: string;
    public time: number;
    public icon: string;
    public options: ResourceOption[];
    constructor(
            id: string,
            type: ResourceType,
            name: string,
            creator: string,
            description: string,
            time: number,
            icon: string,
            options: ResourceOption[]) {
        this.id = id;
        this.type = type;
        this.name = name;
        this.creator = creator;
        this.description = description;
        this.time = time;
        this.icon = icon;
        this.options = options;
    }
}
