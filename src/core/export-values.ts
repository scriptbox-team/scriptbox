export default interface IExports {
    entities: {[id: string]: {
        position: {x: number, y: number},
        collisionBox: {x1: number, y1: number, x2: number, y2: number}
    }};
}
