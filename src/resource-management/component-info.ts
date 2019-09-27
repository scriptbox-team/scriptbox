import ComponentOption from "./component-option";

export default class ComponentInfo {
    public static serialize(
        id: number,
        name: string,
        creator: string,
        description: string,
        time: number,
        icon: string,
        options: ComponentOption[]
    ) {
        if (
                typeof id === "number"
                && typeof name === "string"
                && typeof creator === "string"
                && typeof description === "string"
                && typeof time === "number"
                && typeof icon === "string"
                && Array.isArray(options)
        ) {
            return new ComponentInfo(id, name, creator, description, time, icon, options);
        }
    }
    public id: number;
    public name: string;
    public creator: string;
    public description: string;
    public time: number;
    public icon: string;
    public options: ComponentOption[];
    constructor(
            id: number,
            name: string,
            creator: string,
            description: string,
            time: number,
            icon: string,
            options: ComponentOption[]) {
        this.id = id;
        this.name = name;
        this.creator = creator;
        this.description = description;
        this.time = time;
        this.icon = icon;
        this.options = options;
    }
}
