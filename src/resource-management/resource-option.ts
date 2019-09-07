export enum ResourceOptionType {
    Image = "image",
    Sound = "sound",
    Number = "number",
    String = "string",
    Boolean = "boolean",
    Entity = "entity",
    Component = "component",
    Object = "object",
    Array = "array"
}

export default class ResourceOption {
    public static serialize(
            id: string,
            name: string,
            type: ResourceOptionType,
            displayValue: string,
            readOnly: boolean) {
        if (
            typeof id === "string"
            && typeof name === "string"
            && typeof type === "string"
            && typeof displayValue === "string"
            && typeof readOnly === "boolean"
        ) {
            return new ResourceOption(id, name, type, displayValue, readOnly);
        }
    }
    public id: string;
    public name: string;
    public type: ResourceOptionType;
    public displayValue: string;
    public readOnly: boolean;
    constructor(id: string, name: string, type: ResourceOptionType, displayValue: string, readOnly: boolean) {
        this.id = id;
        this.name = name;
        this.type = type;
        this.displayValue = displayValue;
        this.readOnly = readOnly;
    }
}
