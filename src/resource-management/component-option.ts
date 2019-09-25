export enum ComponentOptionType {
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

export default class ComponentOption {
    public static serialize(
            id: string,
            name: string,
            type: ComponentOptionType,
            baseValue: string,
            readOnly: boolean,
            currentValue: string) {
        if (
            typeof id === "string"
            && typeof name === "string"
            && typeof type === "string"
            && typeof baseValue === "string"
            && typeof readOnly === "boolean"
            && typeof currentValue === "string" || typeof currentValue === "undefined"
        ) {
            return new ComponentOption(id, name, type, baseValue, readOnly);
        }
    }
    public id: string;
    public name: string;
    public type: ComponentOptionType;
    public baseValue: string;
    public currentValue?: string;
    public readOnly: boolean;
    constructor(
            id: string,
            name: string,
            type: ComponentOptionType,
            baseValue: string,
            readOnly: boolean,
            currentValue?: string) {
        this.id = id;
        this.name = name;
        this.type = type;
        this.baseValue = baseValue;
        this.readOnly = readOnly;
        this.currentValue = currentValue;
    }
}
