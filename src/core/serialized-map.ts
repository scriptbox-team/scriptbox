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
    entityReferences: Array<{
        entID: string;
        parentID: number;
        name: string;
    }>;
    playerReferences: Array<{
        playerID: string;
        parentID: number;
        name: string;
    }>;
    componentInfoReferences: Array<{
        componentID: string;
        parentID: number;
        name: string;
    }>;
}
