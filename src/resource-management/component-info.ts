import ComponentOption from "./component-option";

export default class ComponentInfo {
    public static serialize(
        id: string,
        name: string,
        creator: string,
        description: string,
        time: number,
        icon: string,
        enabled: boolean,
        options: ComponentOption[]
    ) {
        if (
                typeof id === "string"
                && typeof name === "string"
                && typeof creator === "string"
                && typeof description === "string"
                && typeof time === "number"
                && typeof icon === "string"
                && typeof enabled === "boolean"
                && Array.isArray(options)
        ) {
            return new ComponentInfo(id, name, creator, description, time, icon, enabled, options);
        }
    }
    public id: string;
    public name: string;
    public creator: string;
    public description: string;
    public time: number;
    public icon: string;
    public enabled: boolean;
    public options: ComponentOption[];
    constructor(
            id: string,
            name: string,
            creator: string,
            description: string,
            time: number,
            icon: string,
            enabled: boolean,
            options: ComponentOption[]) {
        this.id = id;
        this.name = name;
        this.creator = creator;
        this.description = description;
        this.time = time;
        this.icon = icon;
        this.enabled = enabled;
        this.options = options;
    }
}
