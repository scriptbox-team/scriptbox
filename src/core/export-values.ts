interface IComponentInfo {
    name: string;
    attributes: Array<{name: string, kind: string, value: string}>;
}

interface IEntityInfo {
    id: number;
    name: string;
    componentInfo: {[localID: string]: IComponentInfo};
}

export default interface IExports {
    entities: {[id: string]: {
        position: {x: number, y: number},
        collisionBox: {x1: number, y1: number, x2: number, y2: number}
    }};
    watchedEntityInfo: {[watcherID: string]: IEntityInfo};
}
