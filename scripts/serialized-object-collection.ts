interface SerializedObject {
    module?: string;
    object: object;
    componentID?: string;
}

interface SerializedReference {
    objID: number;
    parentID: number;
    name: string;
}

export default interface SerializedObjectCollection {
    objects: SerializedObject[];
    references: SerializedReference[];
}
